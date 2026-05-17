const fs = require('fs');
const filePath = 'g:/O2OEG AI-FIRST SAAS PLATFORM/frontend/src/pages/SalonDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }}") && lines[i-1].trim() === "<button") {
        console.log(`Found at line ${i+1}`);
        lines.splice(i+1, 0,
            '                            className="relative w-14 h-14 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border-4 border-[#13131a] transform -translate-y-2"',
            '                        >',
            '                            <span className="material-symbols-outlined text-[28px]">smart_toy</span>',
            '                        </button>',
            '                    </div>'
        );
        break;
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Done');
