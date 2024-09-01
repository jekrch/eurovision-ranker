import { useEffect, useState } from "react";

const WIDTH_THRESHOLD = 640;

export const useIsCompact = () => {
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsCompact(window.innerWidth < WIDTH_THRESHOLD); 
        };

        handleResize(); // initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isCompact;
};