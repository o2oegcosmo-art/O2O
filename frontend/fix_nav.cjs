const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'SalonDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const searchRegex = /\{\/\*\s*AI Center Button\s*\*\/\}(.|\n)*?<span className="text-\[10px\] font-black uppercase tracking-tighter">Menu<\/span>\s*<\/button>\s*<\/div>\s*<\/div>/m;

const replacement = `{/* AI Center Button */}
                    <div className="relative -mt-8 mx-1">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 blur-xl opacity-50 scale-125"></div>
                        <button
                            onClick={() => { setActiveTab('ai'); setSidebarOpen(false); }}
                            className={\`relative w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl \${activeTab === 'ai' ? 'bg-white text-black scale-105' : 'bg-gradient-to-br from-cyan-400 to-violet-600 text-white'}\`}
                        >
                            <span className="material-symbols-outlined text-[28px]" style={{fontVariationSettings: "'FILL' 1"}}>auto_awesome</span>
                            <span className="text-[8px] font-black uppercase leading-none mt-0.5">AI</span>
                        </button>
                    </div>

                    <button 
                        onClick={() => { setActiveTab('whatsapp'); setSidebarOpen(false); }}
                        className={\`flex flex-col items-center gap-1 transition-all duration-300 \${activeTab === 'whatsapp' ? 'text-green-400' : 'text-white/30'}\`}
                    >
                        <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: activeTab === 'whatsapp' ? "'FILL' 1" : "none"}}>chat</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">واتساب</span>
                    </button>

                    <button 
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className={\`flex flex-col items-center gap-1 transition-all duration-300 \${isSidebarOpen ? 'text-violet-400' : 'text-white/30'}\`}
                    >
                        <span className="material-symbols-outlined text-[24px]">menu</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter">القائمة</span>
                    </button>
                </div>
            </div>`;

if (searchRegex.test(content)) {
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("SUCCESS");
} else {
    console.log("NOT FOUND");
}
