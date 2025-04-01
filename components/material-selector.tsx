"use client"

import { useState } from "react"
import { useMaterialsData } from "@/providers/materials-data-provider"
import { PropertySlider } from "@/components/property-slider"
import { MaterialsTable } from "@/components/materials-table"
import { RadarChart } from "@/components/charts/radar-chart"
import { PropertyBarChart } from "@/components/charts/property-bar-chart"
import { DeviationHeatmap } from "@/components/charts/deviation-heatmap"
import { CorrelationHeatmap } from "@/components/charts/correlation-heatmap"
import { PcaScatterPlot } from "@/components/charts/pca-scatter-plot"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"

export interface PropertyRequirement {
  value: number
  weight: number
}

export interface MaterialRequirements {
  Ultimate_Tensile_Strength_MPa: PropertyRequirement
  Yield_Strength_MPa: PropertyRequirement
  Elastic_Modulus_MPa: PropertyRequirement
  Shear_Modulus_MPa: PropertyRequirement
  Poissons_Ratio: PropertyRequirement
  Density_kg_per_m3: PropertyRequirement
}

export const MaterialSelector = () => {
  const { data, loading, error } = useMaterialsData()
  const [numResults, setNumResults] = useState(5)
  const [selectedProperty, setSelectedProperty] = useState("Ultimate_Tensile_Strength_MPa")
  const [requirements, setRequirements] = useState<MaterialRequirements>({
    Ultimate_Tensile_Strength_MPa: { value: 500, weight: 0.5 },
    Yield_Strength_MPa: { value: 300, weight: 0.5 },
    Elastic_Modulus_MPa: { value: 200000, weight: 0.5 },
    Shear_Modulus_MPa: { value: 80000, weight: 0.5 },
    Poissons_Ratio: { value: 0.3, weight: 0.5 },
    Density_kg_per_m3: { value: 7800, weight: 0.5 },
  })
  const [similarMaterials, setSimilarMaterials] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const propertyDisplayNames = {
    Ultimate_Tensile_Strength_MPa: "Ultimate Tensile Strength (MPa)",
    Yield_Strength_MPa: "Yield Strength (MPa)",
    Elastic_Modulus_MPa: "Elastic Modulus (MPa)",
    Shear_Modulus_MPa: "Shear Modulus (MPa)",
    Poissons_Ratio: "Poisson's Ratio",
    Density_kg_per_m3: "Density (kg/m³)",
  }

  const updateRequirement = (property: keyof MaterialRequirements, field: "value" | "weight", newValue: number) => {
    setRequirements((prev) => ({
      ...prev,
      [property]: {
        ...prev[property],
        [field]: newValue,
      },
    }))
  }

  const findSimilarMaterials = () => {
    if (!data || data.length === 0) return

    // Extract requirement values and weights
    const reqValues = Object.entries(requirements).map(([_, req]) => req.value)
    const reqWeights = Object.entries(requirements).map(([_, req]) => req.weight)

    // Normalize the data for comparison
    const properties = Object.keys(requirements) as (keyof MaterialRequirements)[]

    // Find min and max for each property for normalization
    const mins: Record<string, number> = {}
    const maxs: Record<string, number> = {}

    properties.forEach((prop) => {
      mins[prop] = Math.min(...data.map((m) => m[prop] || 0))
      maxs[prop] = Math.max(...data.map((m) => m[prop] || 0))
    })

    // Calculate distances
    const materialsWithDistances = data.map((material) => {
      let weightedSquaredDistance = 0

      properties.forEach((prop, i) => {
        const min = mins[prop]
        const max = maxs[prop]
        const range = max - min

        // Skip if range is 0 to avoid division by zero
        if (range === 0) return

        const normalizedTarget = (reqValues[i] - min) / range
        const normalizedValue = (material[prop] - min) / range

        // Apply weight to the squared difference
        weightedSquaredDistance += Math.pow(normalizedTarget - normalizedValue, 2) * reqWeights[i]
      })

      return {
        ...material,
        Distance_Score: Math.sqrt(weightedSquaredDistance),
      }
    })

    // Sort by distance and take top N results
    const similar = materialsWithDistances.sort((a, b) => a.Distance_Score - b.Distance_Score).slice(0, numResults)

    setSimilarMaterials(similar)
    setHasSearched(true)
  }

  const downloadResults = () => {
    if (similarMaterials.length === 0) return

    // Convert to CSV
    const headers = ["Material", ...Object.keys(propertyDisplayNames), "Distance_Score"]
    const csvContent = [
      headers.join(","),
      ...similarMaterials.map((material) =>
        headers.map((header) => (material[header] !== undefined ? material[header] : "")).join(","),
      ),
    ].join("\n")

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "material_recommendations.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) return <div className="text-center py-10">Loading material data...</div>
  if (error) return <div className="text-center py-10 text-red-500">Error loading data: {error}</div>
  if (!data || data.length === 0) return <div className="text-center py-10">No material data available</div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar with property sliders */}
      <div className="lg:col-span-1">
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Material Requirements</h2>

          {Object.entries(requirements).map(([property, req]) => (
            <PropertySlider
              key={property}
              property={property as keyof MaterialRequirements}
              displayName={propertyDisplayNames[property as keyof typeof propertyDisplayNames]}
              value={req.value}
              weight={req.weight}
              onChange={updateRequirement}
              min={Math.min(...data.map((m) => m[property as keyof typeof m] || 0))}
              max={Math.max(...data.map((m) => m[property as keyof typeof m] || 0))}
            />
          ))}

          <div className="mt-6">
            <Label htmlFor="num-results">Number of results: {numResults}</Label>
            <Slider
              id="num-results"
              min={1}
              max={10}
              step={1}
              value={[numResults]}
              onValueChange={(value) => setNumResults(value[0])}
              className="mt-2"
            />
          </div>

          <Button className="w-full mt-6" onClick={findSimilarMaterials}>
            Find Recommended Materials
          </Button>
        </Card>
      </div>

      {/* Main content area */}
      <div className="lg:col-span-3">
        {!hasSearched ? (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dataset Overview</h2>
            <p className="mb-4">Total materials in database: {data.length}</p>
            <p>Configure your requirements and click "Find Recommended Materials" to see results.</p>
          </Card>
        ) : (
          <>
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Top {similarMaterials.length} Recommended Materials</h2>
                <Button variant="outline" size="sm" onClick={downloadResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
              <MaterialsTable materials={similarMaterials} />
            </Card>

            <Tabs defaultValue="radar">
              <TabsList className="grid grid-cols-5 mb-6">
                <TabsTrigger value="radar">Radar Chart</TabsTrigger>
                <TabsTrigger value="property">Property Comparison</TabsTrigger>
                <TabsTrigger value="deviation">Deviation Analysis</TabsTrigger>
                <TabsTrigger value="correlation">Correlations</TabsTrigger>
                <TabsTrigger value="pca">PCA Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="radar">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Material Property Radar Chart (Normalized)</h2>
                  <RadarChart
                    materials={similarMaterials}
                    requirements={requirements}
                    propertyDisplayNames={propertyDisplayNames}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="property">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Detailed Property Comparison</h2>
                  <div className="mb-4">
                    <Label htmlFor="property-select">Select property to analyze:</Label>
                    <select
                      id="property-select"
                      className="w-full p-2 border rounded mt-1 bg-background"
                      value={selectedProperty}
                      onChange={(e) => setSelectedProperty(e.target.value)}
                    >
                      {Object.entries(propertyDisplayNames).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <PropertyBarChart
                    materials={similarMaterials}
                    property={selectedProperty as keyof MaterialRequirements}
                    displayName={propertyDisplayNames[selectedProperty as keyof typeof propertyDisplayNames]}
                    targetValue={requirements[selectedProperty as keyof MaterialRequirements].value}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="deviation">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Deviation from Target Requirements</h2>
                  <DeviationHeatmap
                    materials={similarMaterials}
                    requirements={requirements}
                    propertyDisplayNames={propertyDisplayNames}
                  />
                </Card>
              </TabsContent>

              <TabsContent value="correlation">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Material Property Correlations</h2>
                  <CorrelationHeatmap data={data} propertyDisplayNames={propertyDisplayNames} />
                </Card>
              </TabsContent>

              <TabsContent value="pca">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Material Property Dimensionality Analysis</h2>
                  <p className="mb-4">This 2D projection shows how materials relate based on all their properties</p>
                  <PcaScatterPlot data={data} similarMaterials={similarMaterials} />
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}

