import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MaterialsTableProps {
  materials: any[]
}

export const MaterialsTable = ({ materials }: MaterialsTableProps) => {
  if (!materials || materials.length === 0) {
    return <div>No materials to display</div>
  }

  // Get all property columns from the first material
  const propertyColumns = [
    "Ultimate_Tensile_Strength_MPa",
    "Yield_Strength_MPa",
    "Elastic_Modulus_MPa",
    "Shear_Modulus_MPa",
    "Poissons_Ratio",
    "Density_kg_per_m3",
  ].filter((col) => materials[0][col] !== undefined)

  // Format values based on property type
  const formatValue = (property: string, value: any) => {
    if (value === undefined || value === null) return "-"

    if (property === "Poissons_Ratio") {
      return value.toFixed(3)
    } else if (property === "Distance_Score") {
      return value.toFixed(4)
    } else {
      return value.toLocaleString()
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material</TableHead>
            {propertyColumns.map((col) => (
              <TableHead key={col}>{col.replace(/_/g, " ")}</TableHead>
            ))}
            <TableHead>Distance Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{material.Material}</TableCell>
              {propertyColumns.map((col) => (
                <TableCell key={col}>{formatValue(col, material[col])}</TableCell>
              ))}
              <TableCell>{formatValue("Distance_Score", material.Distance_Score)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

