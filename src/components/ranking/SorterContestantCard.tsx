import React, { useEffect } from 'react';
import classNames from 'classnames';
import { FaYoutube } from 'react-icons/fa';
import { useAppSelector } from '../../hooks/stateHooks';
import { LazyLoadedFlag } from '../LazyFlag';
import { getYoutubeThumbnail } from '../../utilities/YoutubeUtil';
import { CountryContestant } from '../../data/CountryContestant';

interface SorterContestantCardProps { 
  countryContestant: CountryContestant; 
  showAsPreviousChoice?: boolean; 
}

const SorterContestantCard: React.FC<SorterContestantCardProps> = ({
  countryContestant,
  showAsPreviousChoice,
}) => {
  const isGlobalMode = useAppSelector((state) => state.globalSearch);
  const showThumbnail = useAppSelector((state) => state.showThumbnail);
  
  const contestant = countryContestant.contestant;
  const country = countryContestant.country;
  const youtubeThumb = getYoutubeThumbnail(contestant?.youtube);
  
  // flag related styles
  const flagContainerStyles = "absolute top-0 left-0 h-full w-[12em] pointer-events-none overflow-hidden";
  const flagImageStyles = "w-full h-full object-cover opacity-60";
  const flagMaskStyle: React.CSSProperties = { 
    display: 'block', 
    WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)', 
    maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%)', 
    objectPosition: 'center center', 
    objectFit: 'cover' 
  };
  
  // thumbnail related styles
  const thumbContainerStyles = "absolute top-0 right-0 h-full w-[35%] pointer-events-none overflow-hidden";
  const thumbImageStyles = "w-full h-full object-cover opacity-50";
  const thumbMaskStyle: React.CSSProperties = { 
    display: 'block', 
    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)', 
    maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 40%)', 
    objectPosition: '50% 50%', 
    objectFit: 'cover', 
    transform: 'scale(1.05)' 
  };
  
  // add css for flag mask effect
  useEffect(() => { 
    const styleId = 'flag-mask-style'; 
    
    if (!document.getElementById(styleId)) { 
      const styleEl = document.createElement('style'); 
      styleEl.id = styleId; 
      styleEl.innerHTML = `
        .flag-mask { 
          -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%); 
          mask-image: linear-gradient(to right, rgba(0,0,0,0.9) 40%, transparent 100%); 
          object-position: center center; 
          object-fit: cover; 
        }
      `; 
      document.head.appendChild(styleEl); 
    } 
  }, []);

  return (
    <div className="relative">
      {/* highlight if this was the previous choice */}
      {showAsPreviousChoice && (
        <div className="absolute inset-0 bg-blue-500 opacity-30 rounded-lg pointer-events-none z-20 border-2 border-blue-400"></div>
      )}
      
      <div className={classNames(
        "m-auto text-slate-400 bg-[#03022d] bg-opacity-30 no-select choice-background", 
        "relative mx-auto min-h-[9em] py-[0.4em]", 
        "flex flex-col items-stretch whitespace-normal text-sm overflow-hidden", 
        "shadow border-y border-0.5 rounded-md", 
        "border-solid border-slate-700", 
        "w-full z-10"
      )}>
        {/* flag background */}
        <div className={flagContainerStyles}>
          <div className="relative w-full h-full">
            {country.key !== 'yu' ? (
              <LazyLoadedFlag code={country.key} className={`${flagImageStyles} flag-mask`} />
            ) : (
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg" 
                alt="Flag of Yugoslavia" 
                className={flagImageStyles} 
                style={flagMaskStyle} 
              />
            )}
          </div>
        </div>
        
        {/* youtube thumbnail */}
        {youtubeThumb && showThumbnail && (
          <div className={thumbContainerStyles}>
            <div className="relative w-full h-full">
              <img 
                src={youtubeThumb} 
                className={thumbImageStyles} 
                style={thumbMaskStyle} 
                alt="" 
              />
            </div>
          </div>
        )}
        
        {/* content */}
        <div className="relative z-10 flex flex-col items-stretch justify-center w-full p-2 pl-32 h-full">
          <div className="flex-grow text-slate-300 font-bold flex flex-col justify-center">
            {/* country name and youtube link */}
            <div className="overflow-hidden overflow-ellipsis flex justify-between items-center mb-2">
              <span className="overflow-hidden overflow-ellipsis text-lg tracking-wide bg-[#301c4c] bg-opacity-35 rounded-md px-2 py-1 shadow-sm">
                {country?.name}
              </span>
              
              <span className="flex flex-row items-center">
                {contestant?.youtube && (
                  <a 
                    href={contestant?.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="rounded text-red-500 hover:text-red-400 transition-colors duration-200" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaYoutube className="text-4xl" title="Watch on YouTube" />
                  </a>
                )}
              </span>
            </div>
            
            {/* artist, song, and year info */}
            <div className="pr-2 font-normal">
              {contestant ? (
                <> 
                  <div className="font-medium text-base bg-[#301c4c] bg-opacity-35 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm">
                    {contestant?.artist}
                  </div> 
                  
                  <div className="mt-2 font-medium text-sm bg-[#301c4c] bg-opacity-35 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm">
                    {contestant.song?.length && !contestant.song?.toLowerCase().includes("tbd") 
                      ? `"${contestant.song}"` 
                      : `${contestant.song}`}
                  </div> 
                  
                  {isGlobalMode && contestant && (
                    <div className="bg-[#1c214c] bg-opacity-75 text-slate-200 text-xs font-bold text-center py-1 px-2 mt-2 inline-block rounded-md ml-2 shadow-sm">
                      {contestant.year}
                    </div>
                  )} 
                </> 
              ) : (
                <span className="font-medium text-sm bg-[#1c214c] bg-opacity-75 rounded-md inline-block px-2 py-1 text-slate-200 shadow-sm italic">
                  did not participate
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SorterContestantCard;