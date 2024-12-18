import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Metrics() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
          <Badge variant="secondary">ALL VACANCIES</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">358</div>
          <div className="mt-4 h-[80px]">
            {/* Add graph component here */}
            <div className="flex gap-2 h-full items-end">
              <div className="w-4 h-[60%] bg-blue-500 rounded" />
              <div className="w-4 h-[80%] bg-blue-500 rounded" />
              <div className="w-4 h-[40%] bg-blue-500 rounded" />
              <div className="w-4 h-[70%] bg-blue-500 rounded" />
              <div className="w-4 h-[50%] bg-blue-500 rounded" />
            </div>
          </div>
          <Badge className="mt-2 bg-green-100 text-green-700">+22 new</Badge>
        </CardContent>
      </Card>
      {/* Similar cards for Active Candidates, Hiring Process, and Candidate Experience */}
    </div>
  )
}

