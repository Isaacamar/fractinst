import { useEffect, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import './Onboarding.css';

interface OnboardingProps {
    setIsBindingsOpen: (isOpen: boolean) => void;
    setCurrentView: (view: 'instrument' | 'piano-roll' | 'sequencer') => void;
}

export const Onboarding = ({ setIsBindingsOpen, setCurrentView }: OnboardingProps) => {
    const driverObj = useRef<any>(null);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('fractinst-onboarding-seen');

        // Define steps
        const steps: DriveStep[] = [
            {
                element: 'body',
                popover: {
                    title: 'Welcome to FractInst!',
                    description: 'A browser-based synthesizer and mini-DAW. Let\'s take a quick tour of the features.',
                    align: 'center'
                }
            },
            {
                element: '#transport-bar',
                popover: {
                    title: 'Transport Controls',
                    description: 'Play, Stop, Record, and Metronome controls. You can also adjust BPM and loop length here.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#view-toggles',
                popover: {
                    title: 'Views',
                    description: 'Switch between Instrument (Synth), Piano Roll, and Sequencer views.',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '#btn-bindings',
                popover: {
                    title: 'Keyboard Bindings',
                    description: 'Click here to see which keys play which notes. Let\'s open it now!',
                    side: 'bottom',
                    align: 'center',
                    onNextClick: () => {
                        setIsBindingsOpen(true);
                        driverObj.current.moveNext();
                    }
                }
            },
            {
                element: '.bindings-modal-content', // Target the modal content if possible, or just center
                popover: {
                    title: 'Keyboard Map',
                    description: 'Use your computer keyboard to play notes. Q=C, 2=C#, W=D, etc. You can also change octaves with Z and X.',
                    side: 'left',
                    align: 'center',
                    onNextClick: () => {
                        setIsBindingsOpen(false);
                        driverObj.current.moveNext();
                    }
                }
            },
            {
                element: '#module-system',
                popover: {
                    title: 'Sound Design',
                    description: 'This is where you craft your sound. Drag modules, tweak knobs, and patch cables (coming soon!).',
                    side: 'left',
                    align: 'start',
                    onPrevClick: () => {
                        setIsBindingsOpen(true);
                        driverObj.current.movePrevious();
                    }
                }
            },
            {
                element: '#oscilloscope',
                popover: {
                    title: 'Oscilloscope',
                    description: 'Visualize your sound in real-time.',
                    side: 'right',
                    align: 'center'
                }
            },
            {
                element: 'body',
                popover: {
                    title: 'You\'re All Set!',
                    description: 'Start playing around! Click anywhere to enable audio if you haven\'t yet.',
                    align: 'center'
                }
            }
        ];

        driverObj.current = driver({
            showProgress: true,
            animate: true,
            steps: steps,
            onDestroyStarted: () => {
                if (!driverObj.current.hasNextStep() || confirm('Are you sure you want to skip the tour?')) {
                    driverObj.current.destroy();
                    localStorage.setItem('fractinst-onboarding-seen', 'true');
                }
            },
        });

        if (!hasSeenOnboarding) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                driverObj.current.drive();
            }, 1000);
        }

        // Expose reset function globally for testing/manual trigger
        (window as any).startOnboarding = () => {
            driverObj.current.drive();
        };

        return () => {
            if (driverObj.current) {
                driverObj.current.destroy();
            }
            delete (window as any).startOnboarding;
        };
    }, [setIsBindingsOpen, setCurrentView]);

    return null; // This component doesn't render anything itself
};
