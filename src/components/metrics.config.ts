export type MetricItem = {
  key: string
  label: string
  value: number | string
  delta?: number
  description: string
}

export type MetricBlock = {
  title: string
  main: MetricItem
  items: MetricItem[]
}

export const METRICS: MetricBlock[] = [
  {
    title: "Total Jobs",
    main: {
      key: "total_jobs",
      label: "Total Jobs",
      value: 23,
      delta: 0,
      description: "Total number of jobs created"
    },
    items: [
      {
        key: "active_jobs",
        label: "Active",
        value: 20,
        delta: -80,
        description: "Jobs currently accepting applications"
      },
      {
        key: "successful_jobs",
        label: "Successful",
        value: 2,
        delta: -10,
        description: "Jobs that resulted in a hire"
      },
      {
        key: "failed_jobs",
        label: "Failed",
        value: 1,
        delta: -10,
        description: "Jobs closed without a hire"
      }
    ]
  }
]
