
import re

filepath = r'src\pages\SalonDashboard.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Print lines 946-972 to see what's there
for i, line in enumerate(lines[946:972], start=947):
    print(f"{i}: {repr(line)}")

# New correct content for lines 948-970 (0-indexed: 947-969)
new_section = """                    {/* AI Center Button */}
                    <div className="relative -mt-8 mx-1">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 blur-xl opacity-50 scale-125"></div>
                        <button
                            onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }}
                            className={`relative w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${activeTab === 'ai' ? 'bg-white text-black scale-105' : 'bg-gradient-to-br from-cyan-400 to-violet-600 text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                            <span className="text-[8px] font-black uppercase leading-none mt-0.5">AI</span>
                        </button>
                    </div>

                    {/* واتساب */}
                    <button onClick={() => { setActiveTab('whatsapp'); setSidebarOpen(false); }} className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300">
                        <span className={`material-symbols-outlined text-[26px] transition-all ${activeTab === 'whatsapp' ? 'text-green-400' : 'text-white/30'}`} style={{fontVariationSettings: activeTab === 'whatsapp' ? "'FILL' 1" : "'FILL' 0"}}>chat</span>
                        <span className={`text-[10px] font-black tracking-tight ${activeTab === 'whatsapp' ? 'text-green-400' : 'text-white/25'}`}>واتساب</span>
                    </button>

                    {/* القائمة */}
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-2xl transition-all duration-300">
                        <span className={`material-symbols-outlined text-[26px] transition-all ${isSidebarOpen ? 'text-violet-400' : 'text-white/30'}`}>menu</span>
                        <span className={`text-[10px] font-black tracking-tight ${isSidebarOpen ? 'text-violet-400' : 'text-white/25'}`}>القائمة</span>
                    </button>
                </div>
            </div>
"""

# Replace lines 947-969 (0-indexed) = lines 948-970 (1-indexed)
new_lines = lines[:947] + [new_section] + lines[970:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print(f"\nDone! New total lines: {len(new_lines)}")
print("File saved successfully.")
