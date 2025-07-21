"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Copy, MessageSquare, Linkedin } from "lucide-react"

export default function JobPostSuccessShare() {
  const [jobLink, setJobLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Generate job link (in real app, this would come from the API response)
    const jobId = "sample-job-" + Date.now()
    const link = `${window.location.origin}/apply/${jobId}`
    setJobLink(link)
  }, [])

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
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="w-5 h-5 mr-2" />
          Share Your Job Post
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Copy Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Link</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={jobLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        {/* Social Sharing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Share on Social Media</label>
          <div className="flex flex-wrap gap-3">
            <Button onClick={shareOnWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareOnLinkedIn} className="bg-blue-700 hover:bg-blue-800 text-white">
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-500 text-sm">QR Code</span>
          </div>
          <p className="text-sm text-gray-600">Print this QR code to share offline</p>
        </div>
      </CardContent>
    </Card>
  )
} 