"use client"

import { useEffect, useRef } from "react"
import {
  Chart,
  type ChartConfiguration,
  ScatterController,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js"

// Register the required Chart.js components
Chart.register(ScatterController, LinearScale, PointElement, LineElement, Tooltip, Legend)

interface PcaScatterPlotProps {
  data: any[]
  similarMaterials: any[]
}

export const PcaScatterPlot = ({ data, similarMaterials }: PcaScatterPlotProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Get numeric properties from the data
    const properties = [
      "Ultimate_Tensile_Strength_MPa",
      "Yield_Strength_MPa",
      "Elastic_Modulus_MPa",
      "Shear_Modulus_MPa",
      "Poissons_Ratio",
      "Density_kg_per_m3",
    ].filter((prop) => data[0][prop] !== undefined)

    // Extract data matrix for PCA
    const dataMatrix = data.map((item) => properties.map((prop) => item[prop]))

    // Standardize the data (mean=0, std=1)
    const means = properties.map((_, j) => {
      const values = dataMatrix.map((row) => row[j])
      return values.reduce((sum, val) => sum + val, 0) / values.length
    })

    const stds = properties.map((_, j) => {
      const values = dataMatrix.map((row) => row[j])
      const mean = means[j]
      const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
      return Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length)
    })

    const standardizedData = dataMatrix.map((row) =>
      row.map((val, j) => (stds[j] === 0 ? 0 : (val - means[j]) / stds[j])),
    )

    // Calculate covariance matrix
    const covMatrix = []
    for (let i = 0; i < properties.length; i++) {
      covMatrix[i] = []
      for (let j = 0; j < properties.length; j++) {
        let sum = 0
        for (let k = 0; k < standardizedData.length; k++) {
          sum += standardizedData[k][i] * standardizedData[k][j]
        }
        covMatrix[i][j] = sum / (standardizedData.length - 1)
      }
    }

    // Simple power iteration method to find the first two principal components
    // This is a simplified approach - a full PCA implementation would use SVD
    const powerIteration = (matrix: number[][], iterations = 100) => {
      const n = matrix.length
      let vector = Array(n)
        .fill(0)
        .map(() => Math.random())

      // Normalize
      const normalize = (v: number[]) => {
        const magnitude = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0))
        return v.map((val) => val / magnitude)
      }

      vector = normalize(vector)

      for (let iter = 0; iter < iterations; iter++) {
        // Matrix-vector multiplication
        const newVector = Array(n).fill(0)
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            newVector[i] += matrix[i][j] * vector[j]
          }
        }

        vector = normalize(newVector)
      }

      return vector
    }

    // Find first principal component
    const pc1 = powerIteration(covMatrix)

    // Deflate the matrix to find the second component
    const deflatedMatrix = []
    for (let i = 0; i < properties.length; i++) {
      deflatedMatrix[i] = []
      for (let j = 0; j < properties.length; j++) {
        deflatedMatrix[i][j] = covMatrix[i][j] - pc1[i] * pc1[j]
      }
    }

    // Find second principal component
    const pc2 = powerIteration(deflatedMatrix)

    // Project data onto the first two principal components
    const projectedData = standardizedData.map((row, idx) => {
      const x = row.reduce((sum, val, j) => sum + val * pc1[j], 0)
      const y = row.reduce((sum, val, j) => sum + val * pc2[j], 0)

      return {
        x,
        y,
        material: data[idx].Material,
        isRecommended: similarMaterials.some((m) => m.Material === data[idx].Material),
      }
    })

    // Separate recommended and non-recommended materials
    const recommendedData = projectedData.filter((point) => point.isRecommended)
    const otherData = projectedData.filter((point) => !point.isRecommended)

    // Create chart configuration
    const config: ChartConfiguration = {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "All Materials",
            data: otherData.map((point) => ({ x: point.x, y: point.y })),
            backgroundColor: "rgba(200, 200, 200, 0.5)",
            pointRadius: 5,
            pointHoverRadius: 7,
          },
          {
            label: "Recommended Materials",
            data: recommendedData.map((point) => ({ x: point.x, y: point.y })),
            backgroundColor: "rgba(255, 99, 132, 0.8)",
            pointRadius: 7,
            pointHoverRadius: 9,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: "Principal Component 1",
            },
          },
          y: {
            title: {
              display: true,
              text: "Principal Component 2",
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const datasetIndex = context.datasetIndex
                const index = context.dataIndex

                const dataset = datasetIndex === 0 ? otherData : recommendedData
                const material = dataset[index].material

                return `${material} (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`
              },
            },
          },
        },
      },
    }

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, config)

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, similarMaterials])

  return (
    <div className="w-full h-[500px]">
      <canvas ref={chartRef}></canvas>
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Note: This is a simplified PCA implementation for visualization purposes.</p>
        <p>Materials that are close together in this plot have similar overall properties.</p>
      </div>
    </div>
  )
}

