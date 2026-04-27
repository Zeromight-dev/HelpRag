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
      const result = await submitScan(
        uploadedFile,
        formData.scanType,
        formData.fitzpatrick,
        formData.age,
        formData.gender,
        formData.localization || undefined,
      )

      // Handle the "Not a medical image" case (422 error from backend)
      // This allows the Results page to show a graceful "Invalid Image" UI
      if (result?.__invalid_image || result?.status === 422) {
        sessionStorage.setItem("PrismDX_result", JSON.stringify({
          __invalid_image: true,
          scan_type_label: scanTypes.find(t => t.value === formData.scanType)?.label ?? formData.scanType,
          message: result.message || "The uploaded image does not appear to be a valid medical scan.",
        }))
        router.push("/results")
        return
      }

      // Handle successful scan
      sessionStorage.setItem("PrismDX_result", JSON.stringify(result))

      // Save to persistent history
      const entry = { ...result, id: crypto.randomUUID() }
      const history = JSON.parse(localStorage.getItem("PrismDX_history") || "[]")
      localStorage.setItem("PrismDX_history", JSON.stringify([entry, ...history]))

      router.push("/results")
    } catch (err: any) {
      // Catch specific 422 errors if the API wrapper throws instead of returning the object
      if (err.status === 422 || err.message?.includes("422")) {
        sessionStorage.setItem("PrismDX_result", JSON.stringify({
          __invalid_image: true,
          scan_type_label: scanTypes.find(t => t.value === formData.scanType)?.label ?? formData.scanType,
          message: "The uploaded image does not appear to be a valid medical scan.",
        }))
        router.push("/results")
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred")
      }
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
            {/* Image Upload */}
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
                      <p className="text-xs text-muted-foreground">Supported: DICOM, PNG, JPEG (max 50MB)</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Demographics Form */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Patient Demographics</CardTitle>
                    <CardDescription>Required for bias cross-referencing</CardDescription>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-sm">
                        Demographics are cross-referenced against peer-reviewed bias baselines
                        (Nature Medicine 2024) to detect potential diagnostic disparities.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                    <div className="flex items-center gap-2">
                      <Label>Lesion Localization</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <p className="text-sm">
                            Body location of the lesion. Used from the HAM10000 dataset schema
                            to improve diagnostic context for the AI model.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
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
                  <div className="flex items-center gap-2">
                    <Label>Fitzpatrick Scale</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm">
                          AI diagnostic accuracy varies significantly across Fitzpatrick skin types.
                          This is used to apply the correct bias baseline from published research.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Select value={formData.fitzpatrick} onValueChange={(v) => setFormData({ ...formData, fitzpatrick: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Fitzpatrick type" /></SelectTrigger>
                    <SelectContent>
                      {fitzpatrickTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className="font-medium">{t.label}</span>
                          <span className="text-muted-foreground"> – {t.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      placeholder="Enter age"
                      min="0"
                      max="120"
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

                <div className="pt-4 border-t border-border">
                  <Button type="submit" className="w-full" size="lg" disabled={!isFormValid || isSubmitting}>
                    {isSubmitting ? (
                      <><Spinner className="mr-2" />Analyzing with Gemini AI...</>
                    ) : (
                      "Run Bias Analysis"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </TooltipProvider>
  )
}