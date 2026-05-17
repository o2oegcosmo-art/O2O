<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Exception;

class ProductionBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'production:backup {--type=all : all|db|whatsapp|storage} {--restore= : Restores from a given timestamp}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'SaaS Production-Grade Backup & Disaster Recovery System (Database, WhatsApp Sessions, Storage)';

    private $backupDir;

    public function __construct()
    {
        parent::__construct();
        $this->backupDir = storage_path('app/backups');
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('restore')) {
            return $this->restoreBackup($this->option('restore'));
        }

        $type = $this->option('type');
        $this->info("🚀 Starting Production Backup Process (Type: {$type})...");

        // Create backup directories
        if (!file_exists($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }

        $timestamp = date('Y-m-d_H-i-s');
        $backupLogs = [];

        try {
            DB::connection()->getPdo(); // Ensure DB is up
        } catch (Exception $e) {
            $this->error("❌ MySQL is down. Cannot perform backup: " . $e->getMessage());
            Log::error("[BACKUP] MySQL is down. Backup process aborted.", ['error' => $e->getMessage()]);
            return 1;
        }

        if ($type === 'all' || $type === 'db') {
            $dbFile = $this->backupDatabase($timestamp);
            if ($dbFile) {
                $backupLogs[] = "Database backup successful: " . basename($dbFile);
            }
        }

        if ($type === 'all' || $type === 'whatsapp') {
            $waFile = $this->backupWhatsAppSessions($timestamp);
            if ($waFile) {
                $backupLogs[] = "WhatsApp sessions backup successful: " . basename($waFile);
            }
        }

        if ($type === 'all' || $type === 'storage') {
            $storageFile = $this->backupStorage($timestamp);
            if ($storageFile) {
                $backupLogs[] = "Storage files backup successful: " . basename($storageFile);
            }
        }

        $this->rotateBackups();

        $this->info("✅ Production Backup completed successfully at {$timestamp}!");
        foreach ($backupLogs as $log) {
            $this->line("   - {$log}");
        }

        return 0;
    }

    /**
     * Backup Database
     */
    private function backupDatabase($timestamp)
    {
        $dbName = env('DB_DATABASE');
        $dbUser = env('DB_USERNAME');
        $dbPassword = env('DB_PASSWORD');
        $dbHost = env('DB_HOST', '127.0.0.1');
        $dbPort = env('DB_PORT', '3306');

        $outFile = "{$this->backupDir}/db_backup_{$timestamp}.sql";
        
        $this->info("🗄️ Dumping Database '{$dbName}'...");

        // Windows vs Linux compatibility
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $cmd = "mysqldump --user={$dbUser} --password={$dbPassword} --host={$dbHost} --port={$dbPort} {$dbName} > \"{$outFile}\"";
        } else {
            $cmd = "mysqldump -u {$dbUser} -p'{$dbPassword}' -h {$dbHost} -P {$dbPort} {$dbName} > \"{$outFile}\" 2>/dev/null";
        }

        exec($cmd, $output, $returnVar);

        if ($returnVar !== 0) {
            // Backup fallback using pure PDO in case mysqldump is not available
            $this->warn("⚠️ mysqldump failed (code {$returnVar}). Attempting pure PHP backup fallback...");
            try {
                $this->fallbackDbDump($outFile);
            } catch (Exception $e) {
                $this->error("❌ Pure PHP backup fallback failed: " . $e->getMessage());
                Log::error("[BACKUP] Database dump failed entirely.", ['error' => $e->getMessage()]);
                return null;
            }
        }

        // Compress SQL file using Gzip
        if (file_exists($outFile)) {
            $gzFile = "{$outFile}.gz";
            $data = file_get_contents($outFile);
            file_put_contents($gzFile, gzencode($data, 9));
            unlink($outFile); // Delete uncompressed file
            $this->info("✅ Compressed DB Backup to: " . basename($gzFile));
            Log::info("[BACKUP] DB backed up successfully.", ['file' => basename($gzFile)]);
            return $gzFile;
        }

        return null;
    }

    /**
     * Fallback PDO Database Dumper
     */
    private function fallbackDbDump($filePath)
    {
        $tables = DB::select('SHOW TABLES');
        $dbKey = 'Tables_in_' . env('DB_DATABASE');
        
        $sql = "-- O2OEG Pure PHP Backup System\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $tableObj) {
            $table = $tableObj->$dbKey;
            
            // Schema
            $createTable = DB::select("SHOW CREATE TABLE `{$table}`");
            $sql .= $createTable[0]->{'Create Table'} . ";\n\n";
            
            // Data
            $rows = DB::table($table)->get();
            if ($rows->count() > 0) {
                $sql .= "INSERT INTO `{$table}` VALUES \n";
                $insertRows = [];
                foreach ($rows as $row) {
                    $values = array_map(function($val) {
                        if (is_null($val)) return 'NULL';
                        return DB::getPdo()->quote($val);
                    }, (array)$row);
                    $insertRows[] = "(" . implode(', ', $values) . ")";
                }
                $sql .= implode(",\n", $insertRows) . ";\n\n";
            }
        }
        
        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        file_put_contents($filePath, $sql);
    }

    /**
     * Backup WhatsApp Sessions
     */
    private function backupWhatsAppSessions($timestamp)
    {
        $waSessionsDir = base_path('../whatsapp-bridge/sessions');
        $registryFile = base_path('../whatsapp-bridge/registry.json');
        $outFile = "{$this->backupDir}/wa_sessions_{$timestamp}.zip";

        if (!file_exists($waSessionsDir) && !file_exists($registryFile)) {
            $this->warn("⚠️ WhatsApp sessions/registry not found. Skipping WhatsApp backup.");
            return null;
        }

        $this->info("📱 Backing up WhatsApp sessions...");

        $zip = new ZipArchive();
        if ($zip->open($outFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            // Add registry file
            if (file_exists($registryFile)) {
                $zip->addFile($registryFile, 'registry.json');
            }

            // Add sessions folder recursively
            if (file_exists($waSessionsDir)) {
                $files = new \RecursiveIteratorIterator(
                    new \RecursiveDirectoryIterator($waSessionsDir),
                    \RecursiveIteratorIterator::LEAVES_ONLY
                );

                foreach ($files as $name => $file) {
                    if (!$file->isDir()) {
                        $filePath = $file->getRealPath();
                        $relativePath = 'sessions/' . substr($filePath, strlen($waSessionsDir) + 1);
                        $zip->addFile($filePath, $relativePath);
                    }
                }
            }

            $zip->close();
            $this->info("✅ Backed up WhatsApp sessions to: " . basename($outFile));
            Log::info("[BACKUP] WhatsApp sessions backed up.", ['file' => basename($outFile)]);
            return $outFile;
        }

        $this->error("❌ Failed to create WhatsApp sessions ZIP backup.");
        return null;
    }

    /**
     * Backup Storage (Uploads, Media)
     */
    private function backupStorage($timestamp)
    {
        $storageDir = storage_path('app/public');
        $outFile = "{$this->backupDir}/storage_backup_{$timestamp}.zip";

        if (!file_exists($storageDir)) {
            $this->warn("⚠️ storage/app/public does not exist. Skipping storage backup.");
            return null;
        }

        $this->info("📂 Backing up storage/app/public...");

        $zip = new ZipArchive();
        if ($zip->open($outFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($storageDir),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $name => $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($storageDir) + 1);
                    $zip->addFile($filePath, $relativePath);
                }
            }

            $zip->close();
            $this->info("✅ Backed up Storage to: " . basename($outFile));
            Log::info("[BACKUP] Storage public directory backed up.", ['file' => basename($outFile)]);
            return $outFile;
        }

        $this->error("❌ Failed to create Storage ZIP backup.");
        return null;
    }

    /**
     * Keep only last 7 backups per category (Database, WhatsApp, Storage)
     */
    private function rotateBackups()
    {
        $this->info("🧹 Cleaning up old backups (Retaining last 7 copies)...");

        $categories = [
            'db' => "{$this->backupDir}/db_backup_*.sql.gz",
            'wa' => "{$this->backupDir}/wa_sessions_*.zip",
            'storage' => "{$this->backupDir}/storage_backup_*.zip",
        ];

        foreach ($categories as $cat => $pattern) {
            $files = glob($pattern);
            if (count($files) > 7) {
                // Sort by oldest first
                array_multisort(array_map('filemtime', $files), SORT_ASC, $files);
                
                $deleteCount = count($files) - 7;
                for ($i = 0; $i < $deleteCount; $i++) {
                    unlink($files[$i]);
                    $this->line("   - Deleted old backup: " . basename($files[$i]));
                    Log::info("[BACKUP_ROTATION] Deleted old backup.", ['file' => basename($files[$i])]);
                }
            }
        }
    }

    /**
     * Restore from a specific backup timestamp
     */
    private function restoreBackup($timestamp)
    {
        $this->warn("⚠️ WARNING: You are restoring system state to timestamp: {$timestamp}");
        if (!$this->confirm('Are you absolutely sure you want to overwrite CURRENT database and session data?')) {
            $this->info('Restoration aborted.');
            return 1;
        }

        $dbGzFile = "{$this->backupDir}/db_backup_{$timestamp}.sql.gz";
        $waZipFile = "{$this->backupDir}/wa_sessions_{$timestamp}.zip";
        $storageZipFile = "{$this->backupDir}/storage_backup_{$timestamp}.zip";

        if (!file_exists($dbGzFile) && !file_exists($waZipFile) && !file_exists($storageZipFile)) {
            $this->error("❌ No backups found with timestamp '{$timestamp}'");
            return 1;
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 1. Restore Database
        if (file_exists($dbGzFile)) {
            $this->info("🗄️ Restoring Database...");
            $sqlFile = str_replace('.gz', '', $dbGzFile);
            
            // Decompress
            $gzdata = gzopen($dbGzFile, 'rb');
            $out = fopen($sqlFile, 'wb');
            while (!gzeof($gzdata)) {
                fwrite($out, gzread($gzdata, 4096));
            }
            fclose($out);
            gzclose($gzdata);

            // Import
            $dbName = env('DB_DATABASE');
            $dbUser = env('DB_USERNAME');
            $dbPassword = env('DB_PASSWORD');
            $dbHost = env('DB_HOST', '127.0.0.1');
            $dbPort = env('DB_PORT', '3306');

            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $cmd = "mysql --user={$dbUser} --password={$dbPassword} --host={$dbHost} --port={$dbPort} {$dbName} < \"{$sqlFile}\"";
            } else {
                $cmd = "mysql -u {$dbUser} -p'{$dbPassword}' -h {$dbHost} -P {$dbPort} {$dbName} < \"{$sqlFile}\" 2>/dev/null";
            }

            exec($cmd, $output, $returnVar);
            unlink($sqlFile); // delete decompressed SQL file

            if ($returnVar !== 0) {
                // Fallback direct execution
                $this->warn("mysql command failed. Running fallback SQL executor...");
                $sqlContent = file_get_contents($sqlFile);
                DB::unprepared($sqlContent);
            }

            $this->info("✅ Database restored successfully.");
            Log::info("[BACKUP] Database restored successfully.", ['timestamp' => $timestamp]);
        }

        // 2. Restore WhatsApp Sessions
        if (file_exists($waZipFile)) {
            $this->info("📱 Restoring WhatsApp sessions...");
            $waSessionsDir = base_path('../whatsapp-bridge/sessions');
            $registryFile = base_path('../whatsapp-bridge/registry.json');

            // Clear existing sessions
            if (file_exists($waSessionsDir)) {
                $this->recursiveRmdir($waSessionsDir);
            }
            mkdir($waSessionsDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($waZipFile) === true) {
                $zip->extractTo(base_path('../whatsapp-bridge'));
                $zip->close();
                $this->info("✅ WhatsApp sessions restored successfully.");
                Log::info("[BACKUP] WhatsApp sessions restored.", ['timestamp' => $timestamp]);
            } else {
                $this->error("❌ Failed to open WhatsApp backup ZIP.");
            }
        }

        // 3. Restore Storage
        if (file_exists($storageZipFile)) {
            $this->info("📂 Restoring public storage...");
            $storageDir = storage_path('app/public');
            
            if (file_exists($storageDir)) {
                $this->recursiveRmdir($storageDir);
            }
            mkdir($storageDir, 0755, true);

            $zip = new ZipArchive();
            if ($zip->open($storageZipFile) === true) {
                $zip->extractTo($storageDir);
                $zip->close();
                $this->info("✅ Public storage restored successfully.");
                Log::info("[BACKUP] Storage restored.", ['timestamp' => $timestamp]);
            } else {
                $this->error("❌ Failed to open Storage backup ZIP.");
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->info("🎉 COMPLETE: Disaster Recovery completed for timestamp: {$timestamp}!");
        return 0;
    }

    private function recursiveRmdir($dir)
    {
        if (is_dir($dir)) {
            $objects = scandir($dir);
            foreach ($objects as $object) {
                if ($object != "." && $object != "..") {
                    if (is_dir($dir . DIRECTORY_SEPARATOR . $object) && !is_link($dir . "/" . $object))
                        $this->recursiveRmdir($dir . DIRECTORY_SEPARATOR . $object);
                    else
                        unlink($dir . DIRECTORY_SEPARATOR . $object);
                }
            }
            rmdir($dir);
        }
    }
}
