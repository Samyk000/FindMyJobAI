"""
Part 2: Add skeleton loading, date column, and reposition plus icon
"""
import re

with open(r"c:\Users\Samee\Desktop\linkedin-job-bot\frontend\app\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Skeleton component after ErrorToast component
skeleton_component = '''
// --- SKELETON LOADER COMPONENT ---

function SkeletonJobRow() {
  return (
    <div className="flex items-center gap-4 p-3 border-l-2 border-transparent animate-pulse">
      <div className="w-10 h-10 bg-zinc-800 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 grid grid-cols-12 gap-4">
        <div className="col-span-4 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
        </div>
        <div className="col-span-2 h-3 bg-zinc-800 rounded w-24"></div>
        <div className="col-span-2 h-3 bg-zinc-800 rounded w-16"></div>
        <div className="col-span-2 h-3 bg-zinc-800 rounded w-20"></div>
        <div className="col-span-2 h-6 bg-zinc-800 rounded w-16"></div>
      </div>
      <div className="flex gap-2 pl-4">
        <div className="w-8 h-8 bg-zinc-800 rounded"></div>
        <div className="w-8 h-8 bg-zinc-800 rounded"></div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---'''

if "SkeletonJobRow" not in content:
    content = content.replace(
        "// --- MAIN COMPONENT ---",
        skeleton_component
    )

# 2. Move plus icon inline with tabs - update the tabs header section
old_tabs_header = r'''           </div>
           
           <button onClick={handleAddTab} className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-lg ml-1 mb-1.5 transition-colors flex-shrink-0" title="New Search">
              <Plus className="w-5 h-5" />
           </button>
        </div>'''

new_tabs_header = '''           </div>
           
           {/* Plus icon inline with tabs */}
           <button onClick={handleAddTab} className="h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-t-lg transition-colors flex-shrink-0 mb-1 border-t border-x border-transparent hover:border-zinc-800" title="New Search">
              <Plus className="w-4 h-4" />
           </button>
        </div>'''

content = re.sub(re.escape(old_tabs_header), new_tabs_header, content)

# 3. Update job list to show skeleton during loading and add fetched date
# Find the section that displays jobs and update it
old_job_display =r'''            ) : displayJobs.length === 0 \? \(
             <div className="flex flex-col items-center justify-center h-full opacity-30">
                <Search className="w-12 h-12 mb-4 text-zinc-600" />
                <p className="text-sm font-medium">No jobs in this view</p>
             </div>
           \) : \('''

new_job_display = '''            ) : pipeline?.state === 'running' && displayJobs.length === 0 ? (
              // Skeleton loader while scraping
              <div className="divide-y divide-zinc-900">
                {[...Array(5)].map((_, i) => <SkeletonJobRow key={i} />)}
              </div>
           ) : displayJobs.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full opacity-30">
                <Search className="w-12 h-12 mb-4 text-zinc-600" />
                <p className="text-sm font-medium">No jobs in this view</p>
             </div>
           ) : ('''

content = re.sub(old_job_display, new_job_display, content, flags=re.DOTALL)

# 4. Update job row to include fetched date column (change grid to 13 columns and add fetched column)
# Find the date_posted column and add fetched column after it
old_grid = r'''                         <div className="col-span-3 flex items-center gap-1.5 text-xs text-zinc-500">
                            <Clock className="w-3 h-3 text-zinc-700" />
                            <span>{j.date_posted}</span>
                         </div>
                         
                         <div className="col-span-2 text-right">'''

new_grid = '''                         <div className="col-span-2 flex items-center gap-1.5 text-xs text-zinc-500">
                            <Clock className="w-3 h-3 text-zinc-700" />
                            <span title={j.date_posted}>{j.date_posted}</span>
                         </div>
                         
                         <div className="col-span-2 flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock className="w-3 h-3 text-zinc-700" />
                            <span className="truncate" title={"Fetched " + (j.fetched_at ? formatDistanceToNow(new Date(j.fetched_at), { addSuffix: true }) : 'unknown')}>
                              {j.fetched_at ? formatDistanceToNow(new Date(j.fetched_at), { addSuffix: true }) : '-'}
                            </span>
                         </div>
                         
                         <div className="col-span-2 text-right">'''

content = re.sub(re.escape(old_grid), new_grid, content)

print("Writing updated page.tsx with skeleton loading and UI improvements...")
with open(r"c:\Users\Samee\Desktop\linkedin-job-bot\frontend\app\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done! Added:")
print("  - Skeleton loading during scraping")
print("  - Fetched date column with relative time")
print("  - Plus icon repositioned inline with tabs")
