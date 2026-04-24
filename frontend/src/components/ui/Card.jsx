export default function Card({ children, title, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}
      {...props}
    >
      {title && (
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
