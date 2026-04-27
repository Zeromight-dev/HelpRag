"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Info, ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { submitScan } from "@/lib/api"

const scanTypes = [
  { value: "chest-xray", label: "Chest X-ray" },
  { value: "skin-lesion", label: "Skin Lesion" },
  { value: "dermoscopy", label: "Dermoscopy" },
  { value: "mammography", label: "Mammography" },
  { value: "ct-scan", label: "CT Scan" },
  { value: "mri", label: "MRI" },
]

const LOCALIZATION_SCAN_TYPES = ["skin-lesion", "dermoscopy"]

const localizationOptions = [
  { value: "face", label: "Face" },
  { value: "scalp", label: "Scalp" },
  { value: "ear", label: "Ear" },
  { value: "neck", label: "Neck" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "abdomen", label: "Abdomen" },
  { value: "upper-extremity", label: "Upper Extremity (arm/hand)" },
  { value: "lower-extremity", label: "Lower Extremity (leg/foot)" },
  { value: "trunk", label: "Trunk" },
  { value: "acral", label: "Acral (palms/soles/nails)" },
  { value: "genital", label: "Genital" },
  { value: "unknown", label: "Unknown / Not specified" },
]

const fitzpatrickTypes = [
  { value: "1", label: "Type I", description: "Pale white skin, always burns, never tans" },
  { value: "2", label: "Type II", description: "White skin, usually burns, tans minimally" },
  { value: "3", label: "Type III", description: "Light brown skin, sometimes burns, tans uniformly" },
  { value: "4", label: "Type IV", description: "Moderate brown skin, rarely burns, tans well" },
  { value: "5", label: "Type V", description: "Dark brown skin, very rarely burns, tans very easily" },
  { value: "6", label: "Type VI", description: "Deeply pigmented dark brown to black skin" },
]

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
]

export default function ScanPage() {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    scanType: "",
    fitzpatrick: "",
    age: "",
    gender: "",
    localization: "",
  })

  const needsLocalization = LOCALIZATION_SCAN_TYPES.includes(formData.scanType)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) setUploadedFile(files[0])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) setUploadedFile(files[0])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadedFile) return
    setIsSubmitting(true)
    setError(null)

    try {
      const apiFormData = new FormData()
      // ... existing formData.append lines ...

      // --- START OF NEW CODE ---
      // This checks if you are on localhost or the live Railway site
      const isLocal = window.location.hostname === "localhost"

      // Replace the URL below with your actual Railway "Public Domain" 
      // Found in Railway Dashboard > Settings > Public Networking
      const RAILWAY_URL = "prismdx-production.up.railway.app"

      const API_URL = isLocal ? "http://localhost:8000" : RAILWAY_URL
      // --- END OF NEW CODE ---

      const res = await fetch(`${API_URL}/scan`, {
        method: "POST",
        body: apiFormData,
      })

      const data = await res.json()

      // Handle the Invalid Image validation from main.py
      if (res.status === 422) {
        sessionStorage.setItem("PrismDX_result", JSON.stringify({
          __invalid_image: true,
          scan_type_label: scanTypes.find(t => t.value === formData.scanType)?.label ?? formData.scanType,
          message: data.detail || "Image does not appear to be a valid medical scan.",
        }))
        router.push("/results")
        return
      }

      if (!res.ok) {
        throw new Error(data.detail || "Scan failed. Please try again.")
      }

      // Success Path
      sessionStorage.setItem("PrismDX_result", JSON.stringify(data))

      const entry = { ...data, id: crypto.randomUUID() }
      const history = JSON.parse(localStorage.getItem("PrismDX_history") || "[]")
      localStorage.setItem("PrismDX_history", JSON.stringify([entry, ...history]))

      router.push("/results")
    } catch (err: any) {
      console.error("Scan Error:", err)
      setError(err instanceof Error ? err.message : "Network error — please check your connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = uploadedFile && formData.scanType && formData.fitzpatrick && formData.age && formData.gender &&
    (!needsLocalization || formData.localization)

  return (
    <TooltipProvider>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">New Scan</h1>
          <p className="text-muted-foreground">Upload a medical image and provide patient demographics for bias analysis</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Medical Image</CardTitle>
                <CardDescription>Upload a DICOM, PNG, or JPEG medical image for analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging
                    ? "border-primary bg-primary/5"
                    : uploadedFile
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*,.dcm"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {uploadedFile ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setUploadedFile(null) }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Drop your image here</p>
                        <p className="text-sm text-muted-foreground">or click to browse</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Patient Demographics</CardTitle>
                <CardDescription>Required for bias cross-referencing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Scan Type</Label>
                  <Select value={formData.scanType} onValueChange={(v) => setFormData({ ...formData, scanType: v, localization: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select scan type" /></SelectTrigger>
                    <SelectContent>
                      {scanTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {needsLocalization && (
                  <div className="space-y-2">
                    <Label>Lesion Localization</Label>
                    <Select value={formData.localization} onValueChange={(v) => setFormData({ ...formData, localization: v })}>
                      <SelectTrigger><SelectValue placeholder="Select body location" /></SelectTrigger>
                      <SelectContent>
                        {localizationOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Fitzpatrick Scale</Label>
                  <Select value={formData.fitzpatrick} onValueChange={(v) => setFormData({ ...formData, fitzpatrick: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Fitzpatrick type" /></SelectTrigger>
                    <SelectContent>
                      {fitzpatrickTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
                  {isSubmitting ? <Spinner className="mr-2" /> : "Run Bias Analysis"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}