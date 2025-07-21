import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"


interface CreateJobBreadcrumbProps {
  currentStep: number
}

const steps = [
  "Job Role & Basic Information",
  "Screening Settings",
  "Preview and publish",
]

export function CreateJobBreadcrumb({ currentStep }: CreateJobBreadcrumbProps) {
  return (
    <Breadcrumb className="my-8 w-full px-4">
      <BreadcrumbList className="flex flex-wrap items-center gap-2">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <BreadcrumbItem>
              {idx === currentStep ? (
                <span className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <BreadcrumbPage className="text-primary font-semibold">{step}</BreadcrumbPage>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="bg-gray-200 text-gray-500 font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-gray-500">{step}</span>
                </span>
              )}
            </BreadcrumbItem>
            {idx < steps.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}