export const detectCategory = (title, categories) => {
    const lowerTitle = title.toLowerCase();

    let bestMatch = null;
    let maxMatches = 0;

    for (let category of categories) {
        let matchCount = 0;

        for (let keyword of category.keywords) {
            if (lowerTitle.includes(keyword.toLowerCase())) {
                matchCount++;
            }
        }

        if (matchCount > maxMatches) {
            maxMatches = matchCount;
            bestMatch = category.name;
        }
    }

    return bestMatch || "Other";
};
