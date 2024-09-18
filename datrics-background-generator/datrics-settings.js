// Datrics color sets
const datrics = {
    colors: {
        orange: {
            light: '#ffe9c7',
            default: '#f79400',
            dark: '#ba4e00'
        },
        lime: {
            light: '#dff8b8',
            default: '#abf337',
            dark: '#73ba00'
        },
        cyan: {
            light: '#b2ffff',
            default: '#05e7f6',
            dark: '#00acb7'
        },
        red: {
            light: '#ffd9d5',
            default: '#e7360c',
            dark: '#af0000'
        },
        blue: {
            light: '#d9f3ff',
            default: '#1e57e8',
            dark: '#000060'
        },
        magenta: {
            light: '#feadf0',
            default: '#ff52ec',
            dark: '#ae00ea'
        },
        gray: {
            light: '#e4ecef',
            default: '#7c888d',
            dark: '#092028'
        },
        white: '#ffffff'
    },
    logo: {
        url: 'https://path-to-your-logo.svg', // Replace with actual logo URL
        width: 116,
        height: 28
    }
};

// Function to get all colors as a flat object (for backwards compatibility)
datrics.getAllColors = function() {
    const allColors = {};
    Object.entries(this.colors).forEach(([colorName, colorSet]) => {
        if (typeof colorSet === 'string') {
            allColors[colorName] = colorSet;
        } else {
            Object.entries(colorSet).forEach(([shade, value]) => {
                allColors[`${colorName}${shade}`] = value;
            });
        }
    });
    return allColors;
};

// Export the datrics object if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = datrics;
}
