import React, { useState, useEffect, useRef } from 'react'

const LazyImage = ({ src, alt, className, fallback, lowQualitySrc }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => setIsLoaded(true)

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {lowQualitySrc && !isLoaded && isInView && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={`${className} blur-sm`}
          aria-hidden="true"
        />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={(e) => {
            if (fallback) e.target.src = fallback
          }}
        />
      )}
    </div>
  )
}

export default LazyImage
