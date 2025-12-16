# Temp script to update CreateMusic.jsx with unified collapsible design
 = 'c:/Users/User/.gemini/antigravity/playground/swift-comet/frontend_new/src/pages/CreateMusic.jsx'
 = Get-Content  -Raw

# Update quick ideas button
 =  -replace '(?s)            {/\* Collapsible Quick Ideas \*/}[\s\S]*?            </div>[\s\S]*?{/\* Categorías', @'
            {/* Collapsible Quick Ideas */}
            <div className="mb-4">
                <button 
                    onClick={() => setShowQuickIdeas(!showQuickIdeas)}
                    className="w-full py-4 px-5 bg-white border-2 border-indigo-200 hover:border-indigo-300 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                            <span className="text-xl">💡</span>
                        </div>
                        <span className="font-semibold text-slate-800">Ideas Rápidas</span>
                    </div>
                    <ChevronDown size={22} className={	ransition-transform text-indigo-600 } />
                </button>
            </div>

            {/* Categorías'@

# Update admin upload button  
 =  -replace '(?s)            {/\* Admin Upload Button \*/}[\s\S]*?            </div>[\s\S]*?            \)}[\s\S]*?{/\* Upload Form', @'
            {/* Admin Upload Button */}
            {userRole === 'admin' && (
                <div className="mb-4">
                    <button 
                        onClick={() => setShowUploadForm(!showUploadForm)}
                        className="w-full py-4 px-5 bg-white border-2 border-amber-200 hover:border-amber-300 rounded-2xl flex items-center justify-between transition-all shadow-sm hover:shadow-md group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                <Upload size={20} className="text-amber-700" />
                            </div>
                            <span className="font-semibold text-slate-800">Subir Canción (Admin)</span>
                        </div>
                        <ChevronDown size={22} className={	ransition-transform text-amber-600 } />
                    </button>
                </div>
            )}

            {/* Upload Form'@

 | Set-Content  -NoNewline
