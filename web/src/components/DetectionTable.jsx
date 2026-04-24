import React from 'react'

export default function DetectionTable({ detections }) {
  if (!detections || detections.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-white/60">
        <p>No detections found in this image</p>
      </div>
    )
  }

  // Class color mapping
  const classColors = {
    weed: 'from-red-500/20 to-red-600/20 text-red-200 border-red-400/50',
    disease: 'from-orange-500/20 to-orange-600/20 text-orange-200 border-orange-400/50',
    pest: 'from-purple-500/20 to-purple-600/20 text-purple-200 border-purple-400/50',
    anomaly: 'from-yellow-500/20 to-yellow-600/20 text-yellow-200 border-yellow-400/50',
  }

  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-300">
                Class
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-300">
                Confidence
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-300">
                Severity
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-300">
                Size (px²)
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-blue-300">
                Position
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {detections.map((detection, index) => {
              const colorClass =
                classColors[detection.class_name] ||
                'from-gray-500/20 to-gray-600/20 text-gray-200 border-gray-400/50'

              const confidencePercent = (detection.confidence * 100).toFixed(1)
              const severityPercent = detection.severity_score
                ? (detection.severity_score * 100).toFixed(1)
                : 'N/A'
              const area = detection.bbox.area.toFixed(0)
              const x = detection.bbox.x1.toFixed(0)
              const y = detection.bbox.y1.toFixed(0)

              return (
                <tr
                  key={index}
                  className="hover:bg-white/5 transition-colors duration-200"
                >
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-gradient-to-r ${colorClass}`}
                    >
                      {detection.class_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-white/10 rounded-full h-2 border border-white/20">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full"
                          style={{
                            width: `${confidencePercent}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-blue-300 w-12">
                        {confidencePercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {severityPercent !== 'N/A' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/10 rounded-full h-2 border border-white/20">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-red-600 h-full rounded-full"
                            style={{
                              width: `${severityPercent}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-yellow-300 w-12">
                          {severityPercent}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-white/50">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70 font-mono">
                    {area}
                  </td>
                  <td className="px-6 py-4 text-sm text-white/70 font-mono">
                    ({x}, {y})
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-white/10 bg-white/5 px-6 py-4">
        <p className="text-sm text-white/60">
          Total: <span className="font-semibold text-blue-300">{detections.length}</span> hotspots detected
        </p>
      </div>
    </div>
  )
}
