import sys
file_path = 'g:/O2OEG AI-FIRST SAAS PLATFORM/frontend/src/pages/SalonDashboard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }}" in line and lines[i-1].strip() == "<button":
        print(f"Found at line {i+1}")
        lines.insert(i+1, '                            className="relative w-14 h-14 bg-gradient-to-br from-cyan-400 to-violet-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 border-4 border-[#13131a] transform -translate-y-2"\n')
        lines.insert(i+2, '                        >\n')
        lines.insert(i+3, '                            <span className="material-symbols-outlined text-[28px]">smart_toy</span>\n')
        lines.insert(i+4, '                        </button>\n')
        lines.insert(i+5, '                    </div>\n')
        break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
