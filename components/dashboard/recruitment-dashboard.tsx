'use client'

export function RecruitmentDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Active Placements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">24</div>
          <p className="text-xs text-muted-foreground">
            +12% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Candidate Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">156</div>
          <p className="text-xs text-muted-foreground">
            42 new this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Satisfaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">94%</div>
          <p className="text-xs text-muted-foreground">
            Average rating
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 