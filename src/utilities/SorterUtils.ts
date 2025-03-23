import { Comparison } from "../components/ranking/SorterModal";
import { CountryContestant } from "../data/CountryContestant";

/**
 * generate initial comparisons needed to begin sorting
 */
export const generateInitialComparisons = (items: CountryContestant[]): Comparison[] => {
    if (items.length <= 1) return [];

    const comps: Comparison[] = [];

    // connect items in a spanning tree pattern for minimal comparisons
    for (let i = 1; i < items.length; i++) {
        comps.push({
            leftItem: items[i - 1],
            rightItem: items[i],
        });
    }

    return comps;
};

/**
 * check if a comparison would be redundant based on existing choices
 * MODIFIED: This now only checks for direct comparisons, not transitive ones
 */
export const isRedundantComparison = (
    itemA: CountryContestant,
    itemB: CountryContestant,
    existingComparisons: Comparison[],
    allItems: CountryContestant[]
): boolean => {
    // Only consider direct comparisons as redundant
    return existingComparisons.some(comp =>
        (comp.leftItem.id === itemA.id && comp.rightItem.id === itemB.id) ||
        (comp.leftItem.id === itemB.id && comp.rightItem.id === itemA.id)
    );

    // Original transitive redundancy checking removed
};

/**
 * generate additional comparisons to improve ranking accuracy
 * prioritizing adjacent items and important comparisons
 */
export const generateAdditionalComparisons = (
    currentRanking: CountryContestant[],
    existingComparisons: Comparison[],
    allItems: CountryContestant[]
): Comparison[] => {
    const additionalComps: Comparison[] = [];

    // first priority: compare adjacent items in current ranking
    for (let i = 0; i < currentRanking.length - 1; i++) {
        const itemA = currentRanking[i];
        const itemB = currentRanking[i + 1];

        // check if these items have been directly compared
        const alreadyCompared = existingComparisons.some(comp =>
            (comp.leftItem.id === itemA.id && comp.rightItem.id === itemB.id) ||
            (comp.leftItem.id === itemB.id && comp.rightItem.id === itemA.id)
        );

        if (!alreadyCompared) {
            additionalComps.push({
                leftItem: itemA,
                rightItem: itemB
            });
        }
    }

    // second priority: compare items with close ratings
    if (additionalComps.length < 3) {
        // create a map of approximate ratings based on current ranking
        const ratingMap = new Map<string, number>();
        currentRanking.forEach((item, index) => {
            ratingMap.set(item.id, currentRanking.length - index); // higher rank = higher rating
        });

        // find pairs of items with close ratings that haven't been compared
        for (let i = 0; i < currentRanking.length; i++) {
            for (let j = i + 2; j < currentRanking.length && j <= i + 5; j++) {
                const itemA = currentRanking[i];
                const itemB = currentRanking[j];

                // skip if already in additionalComps
                if (additionalComps.some(comp =>
                    (comp.leftItem.id === itemA.id && comp.rightItem.id === itemB.id) ||
                    (comp.leftItem.id === itemB.id && comp.rightItem.id === itemA.id)
                )) continue;

                // check if these items have been directly compared
                const alreadyCompared = existingComparisons.some(comp =>
                    (comp.leftItem.id === itemA.id && comp.rightItem.id === itemB.id) ||
                    (comp.leftItem.id === itemB.id && comp.rightItem.id === itemA.id)
                );

                if (!alreadyCompared) {
                    additionalComps.push({
                        leftItem: itemA,
                        rightItem: itemB
                    });

                    if (additionalComps.length >= 3) break;
                }
            }
            if (additionalComps.length >= 3) break;
        }
    }

    // limit number of additional comparisons 
    return additionalComps.slice(0, Math.min(3, additionalComps.length));
};

/**
 * determine if more comparisons would improve ranking accuracy
 * with a more balanced approach to comparison estimates
 */
export const shouldAddMoreComparisons = (
    currentRanking: CountryContestant[],
    existingComparisons: Comparison[],
    allItems: CountryContestant[]
): boolean => {
    // slightly more conservative estimation of needed comparisons
    const minRecommendedComparisons = Math.ceil(allItems.length * Math.log2(allItems.length));

    // check if we have direct comparisons between adjacent items
    let adjacentPairsCompared = true;
    for (let i = 0; i < currentRanking.length - 1; i++) {
        const itemA = currentRanking[i];
        const itemB = currentRanking[i + 1];

        const hasDirectComparison = existingComparisons.some(comp =>
            (comp.leftItem.id === itemA.id && comp.rightItem.id === itemB.id && comp.choice) ||
            (comp.leftItem.id === itemB.id && comp.rightItem.id === itemA.id && comp.choice)
        );

        if (!hasDirectComparison) {
            adjacentPairsCompared = false;
            break;
        }
    }

    // if we have a reasonable number of comparisons and all adjacent pairs are compared,
    // we can stop adding more
    if (existingComparisons.length >= minRecommendedComparisons * 0.8 && adjacentPairsCompared) {
        return false;
    }

    // otherwise, continue if we're below the threshold
    return existingComparisons.length < minRecommendedComparisons;
};

/**
 * calculate final ranking based on all comparisons using ELO-inspired algorithm
 */
export const calculateRanking = (
    allComparisons: Comparison[],
    allItems: CountryContestant[]
): CountryContestant[] => {
    const items = allItems.map(item => ({ ...item }));

    // use elo-like rating system
    const ratingMap = new Map<string, number>();

    // initialize all items with base rating
    items.forEach(item => {
        ratingMap.set(item.id, 1500); // standard ELO starting value
    });

    // apply all comparisons sequentially
    allComparisons.forEach(comp => {
        if (!comp.choice) return; // skip unanswered comparisons

        const leftId = comp.leftItem.id;
        const rightId = comp.rightItem.id;

        const leftRating = ratingMap.get(leftId) || 1500;
        const rightRating = ratingMap.get(rightId) || 1500;

        // calculate expected outcomes
        const expectedLeft = 1 / (1 + Math.pow(10, (rightRating - leftRating) / 400));
        const expectedRight = 1 - expectedLeft;

        // actual outcomes
        const actualLeft = comp.choice === 'left' ? 1 : 0;
        const actualRight = comp.choice === 'right' ? 1 : 0;

        // k-factor determines how much ratings change
        const kFactor = 32;

        // update ratings
        ratingMap.set(leftId, leftRating + kFactor * (actualLeft - expectedLeft));
        ratingMap.set(rightId, rightRating + kFactor * (actualRight - expectedRight));
    });

    // sort items by final rating (descending)
    return items.sort((a, b) => {
        const ratingA = ratingMap.get(a.id) || 1500;
        const ratingB = ratingMap.get(b.id) || 1500;
        return ratingB - ratingA;
    });
};