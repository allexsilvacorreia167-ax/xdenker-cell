export default function BrowserTabBar({ title }: { title: string }) {
    return (
        <div className="flex items-center gap-2 px-4 pt-3 pb-0 bg-[#080b12]">
            <div className="flex items-center gap-2 bg-[#0f1420] rounded-t-lg px-4 py-2 border-t border-x border-white/5 text-xs text-gray-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                {title}
            </div>
        </div>
    );
}