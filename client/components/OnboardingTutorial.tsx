"use client"
import React, { useState, useEffect } from "react"
import { X, ArrowDown, Sparkles, MessageSquare, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface OnboardingTutorialProps {
  onComplete: () => void
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [forceRefresh, setForceRefresh] = useState(0)

  const steps = [
    {
      id: "leon-intro",
      title: "Meet Leon, Your AI Study Buddy! 🤖",
      description: "Leon is your personal AI assistant who'll help you find study groups that match your vibe! He knows about all the groups at UniMelb and can suggest the perfect match based on your subjects, schedule, and personality. Click on him to start chatting!",
      targetSelector: ".leo-chatbot-container [role=\"dialog\"]",
      position: "left",
      highlightPadding: 30,
    },
    {
      id: "discover-groups",
      title: "Discover Amazing Study Groups 📚",
      description: "Browse through hundreds of active study groups across all UniMelb faculties, or let Leon help you find the perfect match based on your specific needs!",
      targetSelector: "[href='/discover']",
      position: "bottom",
      highlightPadding: 12,
    },
    {
      id: "create-group",
      title: "Start Your Own Study Group 🚀",
      description: "Can't find exactly what you're looking for? Create your own study group and invite like-minded students to join your academic journey!",
      targetSelector: "[href='/create-group']",
      position: "bottom",
      highlightPadding: 12,
    }
  ]

  const currentStepData = steps[currentStep]

  useEffect(() => {
    // Add tutorial class to body to control scrolling
    document.body.classList.add('tutorial-active')
    
    // Wait for components to render before starting tutorial
    const timer = setTimeout(() => {
      // Dispatch event to open Leo chatbox first
      window.dispatchEvent(new CustomEvent('openLeoChatbot'))
      // Wait for transition, then start tutorial
      setTimeout(() => {
        setCurrentStep(0)
        setForceRefresh(prev => prev + 1)
      }, 600)
    }, 500)
    
    return () => {
      document.body.classList.remove('tutorial-active')
      clearTimeout(timer)
    }
  }, [])

  // Removed automatic refresh for step 0 since we handle it manually

  const getTargetElement = () => {
    if (!currentStepData?.targetSelector) return null
    
    // For Leo chatbot, try multiple approaches to find the visible element
    if (currentStepData.targetSelector === ".leo-chatbot-container") {
      // Try to find elements in order of preference
      const selectors = [
        // Desktop collapsed panel
        '.leo-chatbot-container .lg\\:flex.w-\\[30vw\\]',
        '.leo-chatbot-container [role="button"]',
        '.leo-chatbot-container .hidden.lg\\:flex',
        // Mobile collapsed button  
        '.leo-chatbot-container .lg\\:hidden',
        '.leo-chatbot-container button',
        // Expanded panel
        '.leo-chatbot-container [role="dialog"]',
        // Fallback to container itself
        '.leo-chatbot-container'
      ]
      
      for (const selector of selectors) {
        const element = document.querySelector(selector) as HTMLElement
        if (element) {
          const rect = element.getBoundingClientRect()
          console.log(`Trying selector: ${selector}`, rect)
          // Accept any element that has some size
          if (rect.width > 0 || rect.height > 0) {
            return element
          }
        }
      }
      
      // Last resort - return the container even if it's not perfectly sized
      return document.querySelector('.leo-chatbot-container') as HTMLElement
    }
    
    // For other elements, use normal selection
    return document.querySelector(currentStepData.targetSelector) as HTMLElement
  }

  const getTooltipPosition = () => {
    const target = getTargetElement()
    if (!target) return { top: 100, left: 100 }

    let rect = target.getBoundingClientRect()
    
    // For Leo chatbot, use the same logic as highlight to get the correct rect
    if (currentStepData.targetSelector === ".leo-chatbot-container" || currentStepData.targetSelector === ".leo-chatbot-container [role=\"dialog\"]") {
      const desktopLeo = document.querySelector('.leo-chatbot-container .lg\\:flex.w-\\[30vw\\]')
      if (desktopLeo && window.innerWidth >= 1024) {
        const desktopRect = desktopLeo.getBoundingClientRect()
        if (desktopRect.width > 0 && desktopRect.height > 0) {
          rect = desktopRect
        }
      } else {
        const mobileButton = document.querySelector('.leo-chatbot-container .lg\\:hidden')
        if (mobileButton) {
          const mobileRect = mobileButton.getBoundingClientRect()
          if (mobileRect.width > 0 && mobileRect.height > 0) {
            rect = mobileRect
          }
        }
      }
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    let top = rect.top + scrollTop
    let left = rect.left + scrollLeft

    const tooltipWidth = 320
    const tooltipHeight = 300 // Increased to account for debug info
    const margin = 20

    switch (currentStepData.position) {
      case "right":
        top += rect.height / 2 - tooltipHeight / 2
        left += rect.width + 20
        break
      case "left":
        // Special case for Leo: position explicitly on the left side of screen
        if (currentStepData.targetSelector === ".leo-chatbot-container" || currentStepData.targetSelector === ".leo-chatbot-container [role=\"dialog\"]") {
          // Position on the left side of the screen, away from the chatbox
          left = window.innerWidth * 0.2 + scrollLeft // 20% from left edge (moved more right)
          top = window.innerHeight * 0.15 + scrollTop // 15% from top (moved higher)
        } else {
          top += rect.height / 2 - tooltipHeight / 2
          left -= tooltipWidth + 20
        }
        break
      case "bottom":
        top += rect.height + 20
        left += rect.width / 2 - tooltipWidth / 2
        break
      case "top":
        top -= tooltipHeight + 20
        left += rect.width / 2 - tooltipWidth / 2
        break
      default:
        // Center positioning as fallback
        top = window.innerHeight / 2 - tooltipHeight / 2 + scrollTop
        left = window.innerWidth / 2 - tooltipWidth / 2 + scrollLeft
        break
    }

    // Ensure tooltip stays within viewport with margins - be more aggressive about staying on screen
    const maxLeft = window.innerWidth - tooltipWidth - margin
    const maxTop = window.innerHeight - tooltipHeight - margin

    // For vertical positioning, prioritize keeping it in the upper portion of the screen
    if (currentStepData.targetSelector === ".leo-chatbot-container" || currentStepData.targetSelector === ".leo-chatbot-container [role=\"dialog\"]") {
      // Keep the explicit positioning we set in the switch case
      // Don't override the top position
    } else {
      top = Math.max(margin + scrollTop, Math.min(top, maxTop + scrollTop))
    }
    
    // For Leo, don't constrain left position as we set it explicitly
    if (currentStepData.targetSelector === ".leo-chatbot-container" || currentStepData.targetSelector === ".leo-chatbot-container [role=\"dialog\"]") {
      // Keep the explicit left positioning
      left = Math.max(margin, left) // Just ensure minimum margin
    } else {
      left = Math.max(margin, Math.min(left, maxLeft))
    }

    return { top, left }
  }

  const getHighlightStyle = () => {
    const target = getTargetElement()
    if (!target) return { top: 0, left: 0, width: 0, height: 0 }

    let rect = target.getBoundingClientRect()
    
    // More lenient visibility check - allow very small elements to still be highlighted
    if (rect.width < 10 && rect.height < 10) {
      return { top: 0, left: 0, width: 0, height: 0 }
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const padding = currentStepData.highlightPadding || 10

    // For Leo chatbot, ensure we get a reasonable highlight area
    if (currentStepData.targetSelector === ".leo-chatbot-container") {
      // If we have a very small or zero-sized target, create a reasonable default highlight area
      if (rect.width < 100 || rect.height < 100) {
        // Position the highlight on the right side of the screen where Leo should be
        const rightAreaWidth = Math.min(400, window.innerWidth * 0.3)
        const rightAreaHeight = Math.min(500, window.innerHeight * 0.6)
        const rightAreaLeft = window.innerWidth - rightAreaWidth - 50
        const rightAreaTop = (window.innerHeight - rightAreaHeight) / 2
        
        return {
          top: rightAreaTop + scrollTop,
          left: rightAreaLeft + scrollLeft,
          width: rightAreaWidth,
          height: rightAreaHeight,
        }
      }
    }

    return {
      top: rect.top + scrollTop - padding,
      left: rect.left + scrollLeft - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      // Force refresh positioning for new step
      setTimeout(() => setForceRefresh(prev => prev + 1), 100)
    } else {
      completeTutorial()
    }
  }

  const skipTutorial = () => {
    completeTutorial()
  }

  const completeTutorial = () => {
    setIsVisible(false)
    localStorage.setItem('hasSeenOnboarding', 'true')
    onComplete()
  }

  const tooltipPosition = getTooltipPosition()
  const highlightStyle = getHighlightStyle()
  const targetElement = getTargetElement()

  // Debug info (only in development)
  const debugInfo = process.env.NODE_ENV === 'development' ? {
    hasTarget: !!targetElement,
    targetSelector: currentStepData.targetSelector,
    highlightStyle,
    elementFound: targetElement ? true : false,
    elementVisible: targetElement ? (targetElement.getBoundingClientRect().width > 0 && targetElement.getBoundingClientRect().height > 0) : false,
    targetRect: targetElement ? targetElement.getBoundingClientRect() : null,
    windowSize: { width: window.innerWidth, height: window.innerHeight }
  } : null

  if (!isVisible) return null

  return (
    <>
      {/* Overlay with blur effect and spotlight */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {highlightStyle.width > 0 && highlightStyle.height > 0 ? (
          <>
            {/* Blur overlay with cutout for highlighted area */}
            <div className="absolute inset-0">
              {/* Top section */}
              <div 
                className="absolute inset-x-0 top-0 bg-black/70 backdrop-blur-sm"
                style={{ height: `${highlightStyle.top}px` }}
              />
              {/* Bottom section */}
              <div 
                className="absolute inset-x-0 bg-black/70 backdrop-blur-sm"
                style={{ 
                  top: `${highlightStyle.top + highlightStyle.height}px`,
                  height: `calc(100vh - ${highlightStyle.top + highlightStyle.height}px)`
                }}
              />
              {/* Left section */}
              <div 
                className="absolute bg-black/70 backdrop-blur-sm"
                style={{ 
                  top: `${highlightStyle.top}px`,
                  left: '0px',
                  width: `${highlightStyle.left}px`,
                  height: `${highlightStyle.height}px`
                }}
              />
              {/* Right section */}
              <div 
                className="absolute bg-black/70 backdrop-blur-sm"
                style={{ 
                  top: `${highlightStyle.top}px`,
                  left: `${highlightStyle.left + highlightStyle.width}px`,
                  width: `calc(100vw - ${highlightStyle.left + highlightStyle.width}px)`,
                  height: `${highlightStyle.height}px`
                }}
              />
            </div>
            
            {/* Highlight border around the clear area */}
            <div
              className="absolute border-4 border-sky-blue rounded-lg shadow-2xl tutorial-highlight"
              style={{
                top: highlightStyle.top - 4,
                left: highlightStyle.left - 4,
                width: highlightStyle.width + 8,
                height: highlightStyle.height + 8,
                pointerEvents: 'none'
              }}
            />
            
            {/* Transparent overlay for the highlighted area to allow clicks */}
            <div
              className="absolute"
              style={{
                top: highlightStyle.top,
                left: highlightStyle.left,
                width: highlightStyle.width,
                height: highlightStyle.height,
                pointerEvents: 'none',
                zIndex: 1
              }}
            />
          </>
        ) : (
          // Fallback: just blur everything except show the tutorial is active
          <>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            {/* Show a default highlight area where Leo should be */}
            <div
              className="absolute border-4 border-sky-blue rounded-lg shadow-2xl tutorial-highlight"
              style={{
                top: '30%',
                right: '5%',
                width: '300px',
                height: '400px',
                pointerEvents: 'none'
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip */}
      <div
        className="fixed z-[9999] w-80 pointer-events-auto transform transition-all duration-500 ease-out"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          animation: 'float 4s ease-in-out infinite'
        }}
      >
        <Card className="border-2 border-sky-blue shadow-2xl bg-white/95 backdrop-blur-sm relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-blue/5 to-purple-500/5 opacity-50" />
          
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Sparkles className="h-6 w-6 text-sky-blue animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full animate-ping" />
                </div>
                <span className="text-sm font-medium text-sky-blue bg-sky-blue/10 px-2 py-1 rounded-full">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-xl font-bold text-deep-blue mb-3 font-serif flex items-center">
              {currentStep === 0 && (
                <div className="mr-3 w-8 h-8 bg-sky-blue rounded-full flex items-center justify-center text-white font-bold text-sm animate-bounce">
                  L
                </div>
              )}
              {currentStepData.title}
            </h3>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              {currentStepData.description}
            </p>

            {currentStep === 0 && (
              <div className="bg-sky-blue/10 border border-sky-blue/20 rounded-lg p-3 mb-4">
                <div className="flex items-center text-sm text-sky-blue">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span className="font-medium">Try saying: "Find me a COMP30024 study group for evenings"</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Leon is positioned on the right side of the hero section. Look for the floating chat panel!
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-sky-blue' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTutorial}
                  className="text-gray-500"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={nextStep}
                  size="sm"
                  className="bg-sky-blue hover:bg-sky-blue/90 text-white"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && <ArrowDown className="ml-1 h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Animated arrow pointing to target */}
        {currentStepData.position === 'left' && (
          <div className="absolute top-1/2 -right-4 transform -translate-y-1/2">
            <div className="w-0 h-0 border-l-4 border-l-sky-blue border-t-4 border-t-transparent border-b-4 border-b-transparent animate-bounce shadow-lg" 
                 style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))' }} />
          </div>
        )}
        {currentStepData.position === 'right' && (
          <div className="absolute top-1/2 -left-4 transform -translate-y-1/2">
            <div className="w-0 h-0 border-r-4 border-r-sky-blue border-t-4 border-t-transparent border-b-4 border-b-transparent animate-bounce shadow-lg"
                 style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))' }} />
          </div>
        )}
        {currentStepData.position === 'bottom' && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-b-4 border-b-sky-blue border-l-4 border-l-transparent border-r-4 border-r-transparent animate-bounce shadow-lg"
                 style={{ filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))' }} />
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 
              0 0 0 4px rgba(56, 189, 248, 0.6),
              0 0 0 8px rgba(56, 189, 248, 0.3),
              0 0 30px rgba(56, 189, 248, 0.8);
          }
          50% {
            box-shadow: 
              0 0 0 6px rgba(56, 189, 248, 0.8),
              0 0 0 12px rgba(56, 189, 248, 0.4),
              0 0 40px rgba(56, 189, 248, 1);
          }
        }
        
        .tutorial-active {
          overflow: hidden;
        }
        
        .tutorial-highlight {
          animation: glow 2s infinite, float 3s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
