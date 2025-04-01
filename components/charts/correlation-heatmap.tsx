"use client"

import { useEffect, useRef } from "react"
import { Chart, type ChartConfiguration, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js"

// Register the required Chart.js components
Chart.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

interface CorrelationHeatmapProps {
  data: any[]
  propertyDisplayNames: Record<string, string>
}

export const CorrelationHeatmap = ({ data, propertyDisplayNames }: CorrelationHeatmapProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Get properties from the data
    const properties = Object.keys(propertyDisplayNames).filter((prop) => data[0][prop] !== undefined)

    // Calculate correlation matrix
    const correlationMatrix: number[][] = []

    for (let i = 0; i < properties.length; i++) {
      correlationMatrix[i] = []

      for (let j = 0; j < properties.length; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1 // Diagonal is always 1
        } else {
          // Calculate Pearson correlation coefficient
          const propX = properties[i]
          const propY = properties[j]

          const valuesX = data.map((item) => item[propX]).filter((val) => val !== undefined && val !== null)
          const valuesY = data.map((item) => item[propY]).filter((val) => val !== undefined && val !== null)

          // Only calculate if we have enough data points
          if (valuesX.length > 2 && valuesY.length > 2) {
            const meanX = valuesX.reduce((sum, val) => sum + val, 0) / valuesX.length
            const meanY = valuesY.reduce((sum, val) => sum + val, 0) / valuesY.length

            let numerator = 0
            let denominatorX = 0
            let denominatorY = 0

            for (let k = 0; k < Math.min(valuesX.length, valuesY.length); k++) {
              const diffX = valuesX[k] - meanX
              const diffY = valuesY[k] - meanY

              numerator += diffX * diffY
              denominatorX += diffX * diffX
              denominatorY += diffY * diffY
            }

            const correlation = numerator / (Math.sqrt(denominatorX) * Math.sqrt(denominatorY))
            correlationMatrix[i][j] = isNaN(correlation) ? 0 : correlation
          } else {
            correlationMatrix[i][j] = 0
          }
        }
      }
    }

    // Create a custom heatmap using a regular chart
    const labels = properties.map((prop) => propertyDisplayNames[prop])

    // Create chart configuration
    const config: ChartConfiguration = {
      type: "scatter",
      data: {
        labels: labels,
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "category",
            position: "bottom",
            title: {
              display: true,
              text: "Properties",
            },
            ticks: {
              autoSkip: false,
              maxRotation: 90,
              minRotation: 0,
            },
          },
          y: {
            type: "category",
            position: "left",
            reverse: true,
            title: {
              display: true,
              text: "Properties",
            },
            ticks: {
              autoSkip: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: (context) => {
                const xIndex = context[0].dataIndex % properties.length
                const yIndex = Math.floor(context[0].dataIndex / properties.length)
                return `${labels[yIndex]} × ${labels[xIndex]}`
              },
              label: (context) => {
                const xIndex = context.dataIndex % properties.length
                const yIndex = Math.floor(context.dataIndex / properties.length)
                const value = correlationMatrix[yIndex][xIndex]
                return `Correlation: ${value.toFixed(2)}`
              },
            },
          },
        },
      },
    }

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, config)

    // Custom drawing function to create the heatmap
    const originalDraw = chartInstance.current.draw
    chartInstance.current.draw = function () {
      originalDraw.apply(this, arguments)
      
      const ctx = this.ctx
      const chartArea = this.chartArea

      if (!chartArea) return

      const cellWidth = chartArea.width / properties.length
      const cellHeight = chartArea.height / properties.length

      // Draw the heatmap cells
      for (let i = 0; i < properties.length; i++) {
        for (let j = 0; j < properties.length; j++) {
          const value = correlationMatrix[i][j]

          // Color scale from blue (negative) to white (zero) to red (positive)
          let color
          if (value < 0) {
            const intensity = Math.round(255 * Math.min(Math.abs(value), 1))
            color = `rgba(0, 0, ${intensity}, 0.8)`
          } else {
            const intensity = Math.round(255 * Math.min(value, 1))
            color = `rgba(${intensity}, 0, 0, 0.8)`
          }

          const x = chartArea.left + j * cellWidth
          const y = chartArea.top + i * cellHeight

          // Draw the cell
          ctx.fillStyle = color
          ctx.fillRect(x, y, cellWidth, cellHeight)

          // Draw the cell border
          ctx.strokeStyle = "rgba(0, 0, 0, 0.1)"
          ctx.strokeRect(x, y, cellWidth, cellHeight)

          // Draw the correlation value
          ctx.fillStyle = "white"
          ctx.font = "10px Arial"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(value.toFixed(2), x + cellWidth / 2, y + cellHeight / 2)
        }
      }
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, propertyDisplayNames])

  return (
    <div className="w-full h-[500px]">
      <canvas ref={chartRef}></canvas>
    </div>
  )
}

