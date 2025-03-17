import { CountryContestant } from '../data/CountryContestant';
import { toast } from 'react-hot-toast';

import { voteCodeHasAnyType, voteCodeHasType } from './VoteProcessor';

/*
  Configuration and Types
*/

export type RankingCanvasConfig = {
  showPlace: boolean,
  voteCode: string, 
  baseItemHeight: number;
  itemMargin: number;
  canvasWidth: number;
  padding: number;
  headerHeight: number;
  footerMargin: number;
  maxSongWidth: number;
  flagSize: number;
  rankWidth: number;
  cardCornerRadius: number;
  fontFamily: string;
  pixelRatio: number;
  fontSizes: {
    title: number;
    rankNumber: number;
    countryName: number;
    artist: number;
    song: number;
    stats: number;
  };
};

export type RankingColors = {
  background: string;
  headerGradient: string[];
  cardBackground: string;
  cardBorder: string;
  rankBackground: string;
  titleText: string;
  rankText: string;
  countryText: string;
  artistText: string;
  songText: string;
  songBackground: string;
  statLabelText: string;
  statValueText: string;
  footerText: string;
  firstPlaceGlow: string;
  firstPlaceGlowOpacity: number;
  shadow: string;
};

const DEFAULT_CONFIG: RankingCanvasConfig = {
  voteCode: '',
  showPlace: false,
  baseItemHeight: 90,
  itemMargin: 8,
  canvasWidth: 500,
  padding: 10,
  headerHeight: 40,
  footerMargin: 10,
  maxSongWidth: 300,
  flagSize: 60,
  rankWidth: 45,
  cardCornerRadius: 4,
  fontFamily: 'Arial',
  pixelRatio: 3,
  fontSizes: {
    title: 28,
    rankNumber: 28,
    countryName: 16,
    artist: 16,
    song: 16,
    stats: 12,
  },
};

const DEFAULT_COLORS: RankingColors = {
  background: '#13172b', 
  headerGradient: ['#517cbc', '#1a2a45', '#9e33ea'],
  cardBackground: 'rgba(40, 49, 91, 0.7)',
  cardBorder: '#94a3b8', // slate-400
  rankBackground: '#334678', // bg-rank
  titleText: '#cbd5e1', // slate-300
  rankText: '#cbd5e1', // slate-300
  countryText: '#cbd5e1', // slate-300
  artistText: '#94a3b8', // slate-400
  songText: '#94a3b8', // slate-400
  songBackground: 'rgba(28, 33, 76, 0)',
  statLabelText: '#6b7280', // gray-500
  statValueText: '#9ca3af', // gray-400
  footerText: '#93c5fd', // blue-300
  firstPlaceGlow: 'rgba(100, 10, 10, 0.9)',
  firstPlaceGlowOpacity: 0.1,
  shadow: 'rgba(0, 0, 0, 0.3)',
};

/*
  Helper Functions
*/

const loadSvgAsImage = (url: string, width: number, height: number): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    fetch(url, { 
      mode: 'cors',
      headers: {
        'Origin': window.location.origin
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then(svgText => {
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const dataUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image(width, height);
        img.onload = () => {
          URL.revokeObjectURL(dataUrl);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(dataUrl);
          reject(new Error(`Failed to load SVG from ${url}`));
        };
        img.src = dataUrl;
      })
      .catch(reject);
  });
};

const loadFlagImage = async (countryCode: string, width: number, height: number): Promise<HTMLImageElement | null> => {
  try {
    const sources = [
      //`https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3/${countryCode.toLowerCase()}.svg`,
      `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`,
      `https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`
    ];
    
    for (const source of sources) {
      try {
        if (source.endsWith('.svg')) {
          return await loadSvgAsImage(source, width, height);
        } else {
          const img = new Image(width, height);
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = source;
          });
          return img;
        }
      } catch (error) {
        console.warn(`Failed to load flag from ${source}:`, error);
      }
    }
    
    throw new Error(`Could not load flag for ${countryCode} from any source`);
  } catch (error) {
    console.warn(`Could not load flag for ${countryCode}:`, error);
    return null;
  }
};

const getColorForCountryCode = (countryKey: string): string => {
  const colorMap: Record<string, string> = {
    'al': '#dc3545', 'am': '#dc3545', 'au': '#28a745', 'at': '#dc3545', 
    'az': '#17a2b8', 'be': '#000000', 'hr': '#dc3545', 'cy': '#ffc107', 
    'cz': '#fd7e14', 'dk': '#343a40', 'ee': '#6f42c1', 'fi': '#28a745', 
    'fr': '#0d6efd', 'ge': '#dc3545', 'de': '#6c757d', 'gr': '#28a745', 
    'is': '#fd7e14', 'ie': '#28a745', 'il': '#28a745', 'it': '#28a745', 
    'lv': '#6f42c1', 'lt': '#ffc107', 'lu': '#dc3545', 'mt': '#28a745', 
    'me': '#6c757d', 'nl': '#fd7e14', 'no': '#dc3545', 'pl': '#6c757d', 
    'pt': '#28a745', 'sm': '#28a745', 'rs': '#dc3545', 'si': '#28a745', 
    'es': '#6f42c1', 'se': '#28a745', 'ch': '#6f42c1', 'ua': '#28a745', 
    'gb': '#28a745', 'uk': '#28a745'  
  };
  
  if (colorMap[countryKey.toLowerCase()]) {
    return colorMap[countryKey.toLowerCase()];
  }
  
  // generate a deterministic color based on country code
  let hash = 0;
  for (let i = 0; i < countryKey.length; i++) {
    hash = countryKey.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + Math.min(Math.max(value, 60), 200).toString(16)).substr(-2);
  }
  
  return color;
};

const loadFont = (fontFamily: string, fontWeight: string = 'normal'): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    document.fonts.ready.then(() => {
      if (document.fonts.check(`${fontWeight} 16px ${fontFamily}`)) {
        resolve(true);
        return;
      }
      
      try {
        const font = new FontFace(fontFamily, `local(${fontFamily})`, { weight: fontWeight });
        font.load().then(() => {
          document.fonts.add(font);
          resolve(true);
        }).catch(() => {
          resolve(false);
        });
      } catch (e) {
        resolve(false);
      }
    });
  });
};

/*
  Canvas Drawing Functions
*/

const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = 4
): void => {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
};

const addShadowEffect = (
  ctx: CanvasRenderingContext2D,
  x: number, 
  y: number, 
  width: number, 
  height: number,
  radius: number = 0,
  shadowColor: string = 'rgba(0, 0, 0, 0.3)'
): void => {
  ctx.save();
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  
  if (radius > 0) {
    roundRect(ctx, x, y, width, height, radius);
  } else {
    ctx.fillRect(x, y, width, height);
  }
  
  ctx.restore();
};

const addFirstPlaceGlow = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  glowColor: string = 'rgba(100, 10, 10, 0.9)',
  fillOpacity: number = 0.1
): void => {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  ctx.fillStyle = `rgba(255, 215, 0, ${fillOpacity})`;
  ctx.fillRect(x, y, width, height);
  
  ctx.restore();
};

const drawFallbackFlag = (
  ctx: CanvasRenderingContext2D,
  countryCode: string,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  ctx.fillStyle = getColorForCountryCode(countryCode);
  ctx.fillRect(x, y, width, height);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(countryCode.toUpperCase(), x + width / 2, y + height / 2);
};

/*
  Component Drawing Functions
*/

const drawHeader = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  // header background - use angle to match CSS's 155deg
  const headerGradient = ctx.createLinearGradient(0, 0, width, height);
  colors.headerGradient.forEach((color, index) => {
    headerGradient.addColorStop(index / (colors.headerGradient.length - 1), color);
  });
  
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, width, height);
  
  // header text
  ctx.fillStyle = colors.titleText;
  ctx.font = `bold ${config.fontSizes.title}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 1.8);
};

const drawFooter = (
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  y: number,
  colors: RankingColors
): void => {
  
  // footer background gradient
  const footerGradient = ctx.createLinearGradient(0, 0, width, 0);
  colors.headerGradient.forEach((color, index) => {
    footerGradient.addColorStop(index / (colors.headerGradient.length - 1), color);
  });
  
  ctx.fillStyle = footerGradient;
  ctx.fillRect(0, y, width, height);
  
  // footer text
  ctx.fillStyle = colors.footerText;
  ctx.font = `14px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y + height / 2);
};

const drawCardBackground = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  isFirstPlace: boolean,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  // card shadow
  ctx.fillStyle = colors.background;
  addShadowEffect(
    ctx, x, y, width, height, 
    config.cardCornerRadius, colors.shadow
  );
  
  // card background
  ctx.fillStyle = colors.cardBackground;
  roundRect(ctx, x, y, width, height, config.cardCornerRadius);
  
  // // special glow for first place
  // if (isFirstPlace) {
  //   addFirstPlaceGlow(
  //     ctx, x, y, width, height, 
  //     colors.firstPlaceGlow, colors.firstPlaceGlowOpacity
  //   );
  // }
  
  // card border
  ctx.strokeStyle = colors.cardBorder;
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  ctx.moveTo(x + config.cardCornerRadius, y);
  ctx.arcTo(x + width, y, x + width, y + height, config.cardCornerRadius);
  ctx.arcTo(x + width, y + height, x, y + height, config.cardCornerRadius);
  ctx.arcTo(x, y + height, x, y, config.cardCornerRadius);
  ctx.arcTo(x, y, x + width, y, config.cardCornerRadius);
  ctx.stroke();
};

const drawRankNumber = (
  ctx: CanvasRenderingContext2D,
  rank: number,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  // rank background
  ctx.fillStyle = colors.rankBackground;
  ctx.beginPath();
  ctx.moveTo(x, y + config.cardCornerRadius);
  ctx.arcTo(x, y, x + config.cardCornerRadius, y, config.cardCornerRadius);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.lineTo(x + config.cardCornerRadius, y + height);
  ctx.arcTo(x, y + height, x, y + height - config.cardCornerRadius, config.cardCornerRadius);
  ctx.lineTo(x, y + config.cardCornerRadius);
  ctx.fill();
  
  // rank number
  ctx.fillStyle = colors.rankText;
  ctx.font = `bold ${config.fontSizes.rankNumber}px ${config.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(rank.toString(), x + width/2, y + height / 2);
  
  // divider line
  ctx.strokeStyle = colors.cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + width, y);
  ctx.lineTo(x + width, y + height);
  ctx.stroke();
};

const drawFlag = (
  ctx: CanvasRenderingContext2D,
  flagImage: HTMLImageElement | null,
  countryCode: string,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  if (flagImage) {
    try {
      ctx.globalAlpha = 0.8;
      ctx.drawImage(flagImage, x, y, width, width * 0.75);
      ctx.globalAlpha = 1.0;
    } catch (error) {
      console.warn('Error drawing flag, using fallback:', error);
      drawFallbackFlag(ctx, countryCode, x, y, width, width * 0.75);
    }
  } else {
    drawFallbackFlag(ctx, countryCode, x, y, width, width * 0.75);
  }
};


/*
  main canvas creation
*/

const drawRankedItem = (
  ctx: CanvasRenderingContext2D,
  item: CountryContestant,
  flagImage: HTMLImageElement | null,
  rank: number,
  yPosition: number,
  itemHeight: number,
  colors: RankingColors,
  config: RankingCanvasConfig
): void => {
  const { country, contestant } = item;
  
  // Card boundaries
  const cardWidth = config.canvasWidth - (config.padding * 2);
  const cardX = config.padding;
  const cardY = yPosition;
  
  // Card vertical center point
  const cardVerticalCenter = cardY + (itemHeight / 2);
  
  // draw background and border
  drawCardBackground(ctx, cardX, cardY, cardWidth, itemHeight, rank === 1, colors, config);
  
  // draw rank number
  drawRankNumber(ctx, rank, cardX, cardY, config.rankWidth, itemHeight, colors, config);
  
  // Flag placement
  const flagX = cardX + config.rankWidth + 15;
  const flagHeight = config.flagSize * 0.75;
  const flagY = cardVerticalCenter - (flagHeight / 2); // Center flag vertically
  
  // draw flag
  drawFlag(ctx, flagImage, country.key, flagX, flagY, config.flagSize, flagHeight);
  
  // Start of text content area
  const textX = flagX + config.flagSize + 15;
  
  // If we have contestant information
  if (contestant) {
    // Calculate content height for vertical centering
    let songLineCount = 1;
    
    // Determine how many lines the song will take
    if (contestant.song) {
      ctx.font = `${config.fontSizes.song}px ${config.fontFamily}`;
      const songText = `"${contestant.song}"`;
      const artistText = contestant.artist;
      ctx.font = `${config.fontSizes.artist}px ${config.fontFamily}`;
      const artistWidth = ctx.measureText(artistText).width;
      
      const firstLineX = textX + artistWidth + 10;
      const firstLineMaxWidth = cardWidth - (firstLineX - cardX) - 40;
      
      // Calculate line count
      if (ctx.measureText(songText).width > firstLineMaxWidth) {
        const words = songText.split(' ');
        let currentLine = words[0];
        let currentMaxWidth = firstLineMaxWidth;
        
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth <= currentMaxWidth) {
            currentLine = testLine;
          } else {
            songLineCount++;
            currentLine = words[i];
            currentMaxWidth = config.maxSongWidth;
          }
        }
      }
    }
    
    // Calculate total content height - only count stats line if we have vote codes
    const hasVoteStats = contestant.votes && voteCodeHasAnyType(config.voteCode);
    const hasRankStats = contestant.finalsRank && config.showPlace;

    const hasStats = hasVoteStats || hasRankStats;
    
    // Country line + artist+song line + additional song lines + stats line (if present)
    const contentLineCount = 1 + 1 + (songLineCount > 1 ? songLineCount - 1 : 0) + (hasStats ? 1 : 0);
    const lineHeight = 24; 
    
    // Add extra spacing for stats line if present
    const statsSpacing = hasStats ? 10 : 0; // 10px extra space before stats line
    const totalContentHeight = (contentLineCount * lineHeight) + statsSpacing;
    
    // Calculate starting Y position for true vertical centering
    // Ensure equal space above and below the content
    const verticalPadding = (itemHeight - totalContentHeight) / 2;
    
    // This moves everything down slightly 
    const opticalAdjustment = voteCodeHasAnyType(config.voteCode) && contestant.votes ? 10 : 5;
    let startY = cardY + verticalPadding + opticalAdjustment;
    
    // Set current Y to start position
    let currentY = startY;
    
    // Draw country name
    ctx.fillStyle = colors.countryText;
    ctx.font = `bold ${config.fontSizes.countryName}px ${config.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(country.name, textX, currentY);
    currentY += lineHeight;
    
    // Draw artist name
    ctx.fillStyle = colors.artistText;
    ctx.font = `${config.fontSizes.artist}px ${config.fontFamily}`;
    const artistText = contestant.artist;
    ctx.fillText(artistText, textX, currentY);
    
    // Draw song title if available
    if (contestant.song) {
      ctx.font = `${config.fontSizes.song}px ${config.fontFamily}`;
      const songText = `"${contestant.song}"`;
      
      const artistWidth = ctx.measureText(artistText).width;
      const songX = textX + artistWidth + 10;
      
      if (ctx.measureText(songText).width <= (cardWidth - (songX - cardX) - 40)) {
        // Song fits on the same line as artist
        const lineWidth = ctx.measureText(songText).width + 8;
        const lineHeight = config.fontSizes.song + 2;
        
        ctx.fillStyle = colors.songBackground;
        roundRect(ctx, songX - 4, currentY - 1, lineWidth, lineHeight, 3);
        
        ctx.fillStyle = colors.songText;
        ctx.fillText(songText, songX, currentY);
        
        // Move to next line for stats (if we have them)
        currentY += lineHeight;
      } else {
        // Multi-line song title
        const words = songText.split(' ');
        let lines = [];
        let currentLine = words[0];
        let currentLineX = songX;
        let currentMaxWidth = cardWidth - (songX - cardX) - 40;
        
        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + ' ' + word;
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth <= currentMaxWidth) {
            currentLine = testLine;
          } else {
            lines.push({ text: currentLine, x: currentLineX });
            currentLine = word;
            currentLineX = textX; // Continuation lines start at the left margin
            currentMaxWidth = config.maxSongWidth;
          }
        }
        
        lines.push({ text: currentLine, x: currentLineX });
        
        // Draw first song line on same line as artist
        const firstLine = lines.shift();
        if (firstLine) {
          const lineWidth = ctx.measureText(firstLine.text).width + 8;
          const lineHeight = config.fontSizes.song + 2;
          
          ctx.fillStyle = colors.songBackground;
          roundRect(ctx, firstLine.x - 4, currentY - 1, lineWidth, lineHeight, 3);
          
          ctx.fillStyle = colors.songText;
          ctx.fillText(firstLine.text, firstLine.x, currentY);
        }
        
        // Move to next line
        currentY += lineHeight;
        
        // Draw remaining song lines
        lines.forEach(line => {
          const lineWidth = ctx.measureText(line.text).width + 8;
          const lineHeight = config.fontSizes.song + 2;
          
          ctx.fillStyle = colors.songBackground;
          roundRect(ctx, line.x - 4, currentY - 1, lineWidth, lineHeight, 3);
          
          ctx.fillStyle = colors.songText;
          ctx.fillText(line.text, line.x, currentY);
          
          currentY += lineHeight;
        });
      }
    } else {
      // No song, still need to move to next line
      currentY += lineHeight;
    }
    
    // Draw stats (votes, ranking) only if we have vote code or show place is enabled
    if (hasVoteStats || hasRankStats) {
      let statsX = textX;
      const statsSpacing = 80;
      
      // Add spacing before the stats line
      currentY += 10; // Increased from 5px to 10px for better separation

      if (
        contestant.votes?.totalPoints !== undefined && 
        voteCodeHasType(config.voteCode, 't')
      ) {
        ctx.fillStyle = colors.statLabelText;
        ctx.font = `${config.fontSizes.stats}px ${config.fontFamily}`;
        ctx.fillText('total:', statsX, currentY);
        
        ctx.fillStyle = colors.statValueText;
        ctx.fillText(`${contestant.votes.totalPoints}`, statsX + 35, currentY);
        statsX += statsSpacing;
      }
      
      if (
        contestant.votes?.telePoints !== undefined && 
        voteCodeHasType(config.voteCode, 'tv')
      ) {
        ctx.fillStyle = colors.statLabelText;
        ctx.fillText('tele:', statsX, currentY);
        
        ctx.fillStyle = colors.statValueText;
        ctx.fillText(`${contestant.votes.telePoints}`, statsX + 35, currentY);
        statsX += statsSpacing;
      }
      
      if (
        contestant.votes?.juryPoints !== undefined && 
        voteCodeHasType(config.voteCode, 'j')
      ) {
        ctx.fillStyle = colors.statLabelText;
        ctx.fillText('jury:', statsX, currentY);
        
        ctx.fillStyle = colors.statValueText;
        ctx.fillText(`${contestant.votes.juryPoints}`, statsX + 35, currentY);
      }
      
      if (contestant.finalsRank && config.showPlace) {
        const rankX = config.canvasWidth - 80;
        
        ctx.fillStyle = colors.statLabelText;
        ctx.font = `${config.fontSizes.stats}px ${config.fontFamily}`;
        ctx.fillText('place:', rankX, currentY);
        
        ctx.fillStyle = colors.statValueText;
        ctx.fillText(`${contestant.finalsRank}`, rankX + 40, currentY);
      }
    }
  } else {
    // No contestant info, just display the country name centered vertically
    ctx.fillStyle = colors.countryText;
    ctx.font = `bold ${config.fontSizes.countryName}px ${config.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Center perfectly in the card
    ctx.fillText(country.name, textX, cardY + (itemHeight / 2));
  }
};


const calculateItemHeights = (
  ctx: CanvasRenderingContext2D,
  rankedItems: CountryContestant[],
  config: RankingCanvasConfig
): { heights: number[], totalHeight: number } => {
  const itemHeights: number[] = [];
  let totalContentHeight = 0;
  
  for (const item of rankedItems) {
    // Start with base height
    let itemHeight = config.baseItemHeight;
    
    if (item.contestant?.song) {
      ctx.font = `${config.fontSizes.song}px ${config.fontFamily}`;
      const songText = `"${item.contestant.song}"`;
      const artistText = item.contestant.artist;
      ctx.font = `${config.fontSizes.artist}px ${config.fontFamily}`;
      const artistWidth = ctx.measureText(artistText).width;
      
      const flagX = config.padding + config.rankWidth;
      const textX = flagX + config.flagSize + 15;
      const firstLineX = textX + artistWidth + 15;
      const firstLineMaxWidth = config.canvasWidth - config.padding - firstLineX - 40;
      
      // Calculate how many lines the song will take
      let songLineCount = 1;
      if (ctx.measureText(songText).width > firstLineMaxWidth) {
        const words = songText.split(' ');
        let currentLine = words[0];
        let currentMaxWidth = firstLineMaxWidth;
        
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const testWidth = ctx.measureText(testLine).width;
          
          if (testWidth <= currentMaxWidth) {
            currentLine = testLine;
          } else {
            songLineCount++;
            currentLine = words[i];
            currentMaxWidth = config.maxSongWidth;
          }
        }
        
        // Add height for additional lines
        itemHeight += (songLineCount - 1) * 24;
      }
      
      // Ensure minimum height for all content
      const hasVoteStats = item.contestant.votes && voteCodeHasAnyType(config.voteCode);
      const hasRankStats = item.contestant.finalsRank && config.showPlace;
      
      // Make sure we have enough room for country + artist/song + extra song lines + stats (if any)
      const statsSpacing = (hasVoteStats || hasRankStats) ? 10 : 0; // 10px spacing before stats
      const minContentHeight = (24 * (2 + (songLineCount - 1) + ((hasVoteStats || hasRankStats) ? 1 : 0))) + statsSpacing;
      
      // Add padding to ensure we have enough space (at least 30px total for padding)
      itemHeight = Math.max(itemHeight, minContentHeight + 30); // 15px padding for top and bottom
    }
    
    itemHeights.push(itemHeight);
    totalContentHeight += itemHeight + config.itemMargin;
  }
  
  return { heights: itemHeights, totalHeight: totalContentHeight };
};


export const createRankingCanvas = async (
  rankedItems: CountryContestant[],
  rankingName: string = 'My Eurovision Ranking',
  customConfig: Partial<RankingCanvasConfig> = {},
  customColors: Partial<RankingColors> = {}
): Promise<HTMLCanvasElement> => {

  // merge default config with custom config
  const config: RankingCanvasConfig = { ...DEFAULT_CONFIG, ...customConfig };
  const colors: RankingColors = { ...DEFAULT_COLORS, ...customColors };
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }
  
  // load fonts
  await loadFont(config.fontFamily, 'normal');
  await loadFont(config.fontFamily, 'bold');
  
  // calculate item heights and total canvas height
  const { heights: itemHeights, totalHeight: totalContentHeight } = 
    calculateItemHeights(ctx, rankedItems, config);
  
  const totalHeight = config.headerHeight + totalContentHeight + config.footerMargin + 30;

  // set canvas dimensions with pixelRatio for higher resolution
  const physicalWidth = config.canvasWidth * config.pixelRatio;
  const physicalHeight = totalHeight * config.pixelRatio;
  
  canvas.width = physicalWidth;
  canvas.height = physicalHeight;
  canvas.style.width = `${config.canvasWidth}px`;
  canvas.style.height = `${totalHeight}px`;
  
  // Scale all rendering operations
  ctx.scale(config.pixelRatio, config.pixelRatio);
  
  // fill background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, config.canvasWidth, totalHeight);
  
  // draw header
  drawHeader(ctx, rankingName, config.canvasWidth, config.headerHeight, colors, config);
  
  // preload flag images
  const countryCodes = rankedItems.map(item => item.country.key);
  const flagImages: Record<string, HTMLImageElement | null> = {};
  
  await Promise.all(
    countryCodes.map(async code => {
      try {
        // Load flags at higher resolution if possible
        const flagSize = config.flagSize * Math.min(2, config.pixelRatio);
        flagImages[code] = await loadFlagImage(code, flagSize, flagSize * 0.75);
      } catch (error) {
        console.warn(`Failed to load flag for ${code}:`, error);
        flagImages[code] = null;
      }
    })
  );
  
  // draw ranked items
  let yPosition = config.headerHeight + config.itemMargin;
  
  for (let i = 0; i < rankedItems.length; i++) {
    const item = rankedItems[i];
    const rank = i + 1;
    const itemHeight = itemHeights[i];
    const flagImage = flagImages[item.country.key];
    
    drawRankedItem(
      ctx,
      item,
      flagImage,
      rank,
      yPosition,
      itemHeight,
      colors,
      config
    );
    
    yPosition += itemHeight + config.itemMargin;
  }
  
  // draw footer
  drawFooter(
    ctx, 
    'created with eurovision-ranker.com', 
    config.canvasWidth, 
    30, 
    totalHeight - 30, 
    colors
  );
  
  return canvas;
};

export const downloadRankingImage = async (
  rankedItems: CountryContestant[],
  rankingName: string = '',
  customConfig: Partial<RankingCanvasConfig> = {},
  customColors: Partial<RankingColors> = {}
): Promise<void> => {
  if (rankedItems.length === 0) {
    toast.error('Please rank some countries first');
    return;
  }
  
  // Set default pixelRatio to 2 for better quality exports if not specified
  if (!customConfig.pixelRatio) {
    customConfig.pixelRatio = 2;
  }
  
  //const toastId = toast.loading('Creating your ranking image...');
  
  try {
    const canvas = await createRankingCanvas(rankedItems, rankingName, customConfig, customColors);
    
    const sanitizedName = rankingName
      ? rankingName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'eurovision-ranking';
    
    const filename = `eurovision-${sanitizedName}.png`;
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Failed to create image blob'));
        else resolve(blob);
      }, 'image/png', 1.0);
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    //toast.dismiss(toastId);
    toast.success('Ranking image downloaded successfully');
  } catch (error) {
    console.error('Error creating ranking image:', error);
    //toast.dismiss(toastId);
    toast.error('Failed to create ranking image');
  }
};
