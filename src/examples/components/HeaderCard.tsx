import type { HeaderCardProps } from '../types'

export const HeaderCard = ({ icon, iconTone = 'blue', title, subtitle, chip, metrics, compact = false }: HeaderCardProps) => {
  const cardClassName = ['basic-grid-header-card']
  if (!compact && metrics && metrics.length > 0) {
    cardClassName.push('basic-grid-header-card--stacked')
  }
  if (compact) {
    cardClassName.push('basic-grid-header-card--compact')
  }

  return (
    <div className={cardClassName.join(' ')}>
      <div className="basic-grid-header-card-main">
        <div className={`basic-grid-header-card-icon basic-grid-header-card-icon--${iconTone}`}>{icon}</div>
        <div className="basic-grid-header-card-body">
          <span className="basic-grid-header-card-title">{title}</span>
          {subtitle && <span className="basic-grid-header-card-subtitle">{subtitle}</span>}
        </div>
        {chip && (
          <span className={`basic-grid-header-chip basic-grid-header-chip--${chip.tone ?? 'blue'}`}>{chip.label}</span>
        )}
      </div>
      {!compact && metrics && metrics.length > 0 && (
        <div className="basic-grid-header-metrics">
          {metrics.map((metric) => (
            <div key={`${title}-${metric.label}`} className="basic-grid-header-metric">
              <span className="basic-grid-header-metric-value">{metric.value}</span>
              <span className="basic-grid-header-metric-label">{metric.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


