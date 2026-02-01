"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, MessageSquare, Linkedin } from "lucide-react"

export default function JobPostSuccessShare({ jobId }: { jobId: string }) {
  const [jobLink, setJobLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!jobId) return
    setJobLink(`https://hyriki.com/apply/${jobId}`)
  }, [jobId])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jobLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(`🎓 We're hiring! Check out this teaching position: ${jobLink}`)
    window.open(`https://wa.me/?text=${message}`, "_blank")
  }

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(jobLink)
    const title = encodeURIComponent("Teaching Position Available")
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, "_blank")
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <div className="border-b border-gray-200 px-6 py-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Share Your Job Post</h3>
      </div>

      <div className="p-6 space-y-5">
        {/* Copy Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={jobLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="shrink-0 border-gray-300 hover:bg-gray-50"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Social Sharing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Share on</label>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={shareOnWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              onClick={shareOnLinkedIn}
              className="bg-blue-700 hover:bg-blue-800 text-white"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
