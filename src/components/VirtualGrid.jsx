import React from 'react'
import { Grid, AutoSizer } from 'react-virtualized'
import 'react-virtualized/styles.css'

const VirtualGridBase = ({ items, renderItem, columnCount = 4, cardHeight = 480, gap = 24 }) => {
  const rowHeight = cardHeight + gap
  const rowCount = Math.ceil(items.length / columnCount)

  const cellRenderer = ({ columnIndex, key, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= items.length) return null

    return (
      <div key={key} style={{ ...style, padding: gap / 2, overflow: 'visible', boxSizing: 'border-box' }}>
        <div style={{ height: cardHeight }}>
          {renderItem(items[index], index)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '72vh', overflow: 'hidden' }}>
      <AutoSizer>
        {({ height, width }) => {
          const totalGapWidth = gap * (columnCount + 1)
          const columnWidth = Math.max(220, (width - totalGapWidth) / columnCount)
          return (
            <Grid
              cellRenderer={cellRenderer}
              columnCount={columnCount}
              columnWidth={columnWidth + gap / 2}
              height={height}
              rowCount={rowCount}
              rowHeight={rowHeight}
              width={width}
              overscanRowCount={3}
            />
          )
        }}
      </AutoSizer>
    </div>
  )
}

const VirtualGrid = React.memo(VirtualGridBase)
export default VirtualGrid
