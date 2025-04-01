import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// This is a server-side route handler that provides the materials data
export async function GET() {
  try {
    // Try to load the CSV file from the project
    try {
      const dataDirectory = path.join(process.cwd(), "public")
      const fileContents = await fs.readFile(dataDirectory + "/Data.csv", "utf8")
      const csvData = parseCsvData(fileContents)
      return NextResponse.json(csvData)
    } catch (fileError) {
      console.warn("Could not load Data.csv file, using fallback data:", fileError)
      // If file loading fails, use the fallback data
      const fallbackData = parseCsvData(getFallbackData())
      return NextResponse.json(fallbackData)
    }
  } catch (error) {
    console.error("Error loading materials data:", error)
    return NextResponse.json({ error: "Failed to load materials data" }, { status: 500 })
  }
}

function parseCsvData(csvContent: string) {
  // Parse the CSV data
  const lines = csvContent.trim().split("\n")
  const headers = lines[0].split(",")

  // Map the headers to the property names used in the application
  const headerMap: Record<string, string> = {
    Su: "Ultimate_Tensile_Strength_MPa",
    Sy: "Yield_Strength_MPa",
    E: "Elastic_Modulus_MPa",
    G: "Shear_Modulus_MPa",
    mu: "Poissons_Ratio",
    Ro: "Density_kg_per_m3",
  }

  // Parse the data rows
  const data = lines.slice(1).map((line) => {
    const values = line.split(",")
    const row: Record<string, any> = {}

    headers.forEach((header, index) => {
      // Use the mapped property name if available
      const propertyName = headerMap[header] || header

      // Parse numeric values
      if (["Su", "Sy", "A5", "Bhn", "E", "G", "mu", "Ro", "pH", "HV"].includes(header)) {
        row[propertyName] = values[index] ? Number.parseFloat(values[index]) : null
      } else {
        row[propertyName] = values[index]
      }

      // Create a Material field that combines material name and heat treatment
      if (header === "Material") {
        const heatTreatment = values[headers.indexOf("Heat treatment")]
        row["Material"] = `${values[index]} ${heatTreatment}`
      }
    })

    return row
  })

  return data
}

function getFallbackData() {
  // This is the fallback CSV data if the file is not available
  return `Std,ID,Material,Heat treatment,Su,Sy,A5,Bhn,E,G,mu,Ro,pH,Desc,HV
ANSI,D8894772B88F495093C43AF905AB6373,Steel SAE 1015,as-rolled,421,314,39,126,207000,79000,0.3,7860,,,
ANSI,05982AC66F064F9EBC709E7A4164613A,Steel SAE 1015,normalized,424,324,37,121,207000,79000,0.3,7860,,,
ANSI,356D6E63FF9A49A3AB23BF66BAC85DC3,Steel SAE 1015,annealed,386,284,37,111,207000,79000,0.3,7860,,,
ANSI,1C758F8714AC4E0D9BD8D8AE1625AECD,Steel SAE 1020,as-rolled,448,331,36,143,207000,79000,0.3,7860,,,
ANSI,DCE10036FC1946FC8C9108D598D116AD,Steel SAE 1020,normalized,441,346,35.8,131,207000,79000,0.3,7860,550,,
ANSI,2EC038241908434FA714FEEBE24DDEFE,Steel SAE 1020,annealed,395,295,36.5,111,207000,79000,0.3,7860,,,
ANSI,356B183DD9E34A1C80A5028D43B9E149,Steel SAE 1022,as-rolled,503,359,35,149,207000,79000,0.3,7860,,,
ANSI,95CB82FA86314D8490932A9E740744E3,Steel SAE 1022,normalized,483,359,34,143,207000,79000,0.3,7860,,,
ANSI,942333E2D11B4C2CA0B9DFD6D1CE38E0,Steel SAE 1022,annealed,450,317,35,137,207000,79000,0.3,7860,,,
ANSI,5E035DD0692F47E3A92EB298101AA124,Steel SAE 1030,as-rolled,552,345,32,179,207000,79000,0.3,7860,,,
ANSI,8C9BE76E417841C3B821D4776B498039,Steel SAE 1030,normalized,517,345,32,149,207000,79000,0.3,7860,,,
ANSI,39E235137DD74F3CA35EA024AFD04964,Steel SAE 1030,annealed,464,341,31,126,207000,79000,0.3,7860,,,
ANSI,436484F7350147F7A2982D1410FB03CC,Steel SAE 1030,tempered at 400 F,848,648,17,495,207000,79000,0.3,7860,,,
ANSI,65BF7EFEEAE24296AC60198D15FCEFD6,Steel SAE 1040,as-rolled,621,414,25,201,207000,79000,0.3,7860,,,
ANSI,E9134C5FCB8C41569B3B50315A4D13A5,Steel SAE 1040,normalized,590,374,28,170,207000,79000,0.3,7860,,,
ANSI,CEEFEC39D52C4CBC9FD7A599BF6E4078,Steel SAE 1040,annealed,519,353,30,149,207000,79000,0.3,7860,310,,
ANSI,C3F57A34049943E98579CCEF761EE90D,Steel SAE 1040,tempered at 400 F,779,593,19,262,207000,79000,0.3,7860,,,
ANSI,6BB34C63B60749ADA2E4522BE8B284E2,Steel SAE 1050,as-rolled,724,414,20,229,207000,79000,0.3,7860,,,
ANSI,5D7646BB490A4A41A0C059C46224189F,Steel SAE 1050,normalized,748,427,20,217,207000,79000,0.3,7860,,,
ANSI,4DD78B764534417698C437FBECD1B914,Steel SAE 1050,annealed,636,365,23.7,187,207000,79000,0.3,7860,390,,`
}

