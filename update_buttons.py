import re

# Read file
with open('c:/Users/User/.gemini/antigravity/playground/swift-comet/frontend_new/src/pages/CreateMusic.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Update quick ideas button
old_quick = r'([ ]*){/\* Collapsible Quick Ideas \*/}\s*<div className="mb-6">\s*<button\s*onClick=\{[^}]+\}\s*className="[^"]*"[^>]*>\s*<span className="[^"]*">💡[^<]*</span>\s*<ChevronDown[^/]+/>\s*</button>\s*</div>'

new_quick = r'''\1{/* Collapsible Quick Ideas */}
\1<div className="mb-4">
\1    <button 
\1        onClick={() => setShowQuickIdeas(!showQuickIdeas)}
\1        className="w-full py-4 px-5 bg-white border-2 border-indigo-200 hover:border-indigo-300 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
\1    >
\1        <div className="flex items-center gap-3">
\1            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
\1                <span className="text-xl">💡</span>
\1            </div>
\1            <span className="font-semibold text-slate-800">Ideas Rápidas</span>
\1        </div>
\1        <ChevronDown size={22} className={`transition-transform text-indigo-600 ${showQuickIdeas ? 'rotate-180' : ''}`} />
\1    </button>
\1</div>'''

content = re.sub(old_quick, new_quick, content, flags=re.DOTALL)

# Pattern 2: Update admin upload button  
old_admin = r'([ ]*){/\* Admin Upload Button \*/}\s*\{userRole === \'admin\' && \(\s*<div className="mb-6">\s*<button\s*onClick=\{[^}]+\}\s*className="[^"]*bg-amber[^"]*"[^>]*>\s*<Upload[^/]+/>[^<]*</button>\s*</div>\s*\)\}'

new_admin = r'''\1{/* Admin Upload Button */}
\1{userRole === 'admin' && (
\1    <div className="mb-4">
\1        <button 
\1            onClick={() => setShowUploadForm(!showUploadForm)}
\1            className="w-full py-4 px-5 bg-white border-2 border-amber-200 hover:border-amber-300 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
\1        >
\1            <div className="flex items-center gap-3">
\1                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
\1                    <Upload size={20} className="text-amber-700" />
\1                </div>
\1                <span className="font-semibold text-slate-800">Subir Canción (Admin)</span>
\1            </div>
\1            <ChevronDown size={22} className={`transition-transform text-amber-600 ${showUploadForm ? 'rotate-180' : ''}`} />
\1        </button>
\1    </div>
\1)}'''

content = re.sub(old_admin, new_admin, content, flags=re.DOTALL)

# Write file
with open('c:/Users/User/.gemini/antigravity/playground/swift-comet/frontend_new/src/pages/CreateMusic.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated successfully!")
