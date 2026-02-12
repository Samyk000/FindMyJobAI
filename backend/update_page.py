"""
Helper script to update page.tsx with real-time updates and UI improvements
"""
import re

# Read the current file
with open(r"c:\Users\Samee\Desktop\linkedin-job-bot\frontend\app\page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add formatDistanceToNow import
if "formatDistanceToNow" not in content:
    content = content.replace(
        'import React, { useEffect, useState, useMemo, useCallback } from "react";',
        '''import React, { useEffect, useState, useMemo, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";'''
    )

# 2. Add currentBatchId state (already done, skip if exists)
if "currentBatchId" not in content:
    content = content.replace(
        '  const [pipelineJobId, setPipelineJobId] = useState<string>("");',
        '''  const [pipelineJobId, setPipelineJobId] = useState<string>("");
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);'''
    )

# 3. Update fetchJobs to accept batchId parameter
old_fetchJobs = r'''  const fetchJobs = useCallback\(async \(\) => \{
    try \{
      const data = await fetchWithError\(`\$\{BACKEND\}/jobs/search`, \{
        method: "POST",
        headers: \{ "Content-Type": "application/json" \},
        body: JSON.stringify\(\{ 
          status: viewStatus === 'new' \? 'active' : viewStatus,
          limit: 500 
        \}\),
      \}\);'''

new_fetchJobs = '''  const fetchJobs = useCallback(async (batchId?: string) => {
    try {
      const data = await fetchWithError(`${BACKEND}/jobs/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: viewStatus === 'new' ? 'active' : viewStatus,
          limit: 500,
          batch_id: batchId || undefined
        }),
      });'''

content = re.sub(old_fetchJobs, new_fetchJobs, content, flags=re.DOTALL)

# 4. Update pipeline polling to use batch_id
old_polling = r'''        // Fetch jobs in real-time while scraping to show incremental updates
        if \(data\.state === "running" && data\.stats\?\.batch_id\) \{
          await fetchJobs\(\);
        \}'''

new_polling = '''        // Fetch jobs in real-time while scraping to show incremental updates
        if (data.state === "running" && data.stats?.batch_id) {
          setCurrentBatchId(data.stats.batch_id as string);
          await fetchJobs(data.stats.batch_id as string);
        }'''

content = re.sub(old_polling, new_polling, content, flags=re.DOTALL)

# 5. Clear currentBatchId when done
old_done = r'''        if \(data\.state === "done" \|\| data\.state === "failed"\) \{
          setPipelineJobId\(""\);'''

new_done = '''        if (data.state === "done" || data.state === "failed") {
          setPipelineJobId("");
          setCurrentBatchId(null);'''

content = re.sub(old_done, new_done, content, flags=re.DOTALL)

print("Writing updated page.tsx...")
with open(r"c:\Users\Samee\Desktop\linkedin-job-bot\frontend\app\page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done! Updated page.tsx with real-time batch filtering.")
