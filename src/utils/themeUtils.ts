export interface Theme {
  // Base colors
  primary: string;
  secondary: string;
  background: string;
  text: string;
  border: string;

  // Header specific
  headerBg: string;
  headerText: string;
  headerIconColor: string;
  headerHighlight: string;
  headerBorder: string;

  // Filters section
  filtersBg: string;
  filtersText: string;
  filtersIconColor: string;
  filtersBorder: string;
  filtersButtonBg: string;
  filtersButtonText: string;
  filtersButtonHover: string;

  // Chat panel
  chatBg: string;
  chatText: string;
  chatBubbleBg: string;
  chatBubbleText: string;
  chatBubbleBotBg: string;
  chatBubbleBotText: string;

  // Menu Item panel
  menuItemBg: string;
  menuItemText: string;
  menuItemPrice: string;

  // Input panel
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  inputIconColor: string;
  inputButtonBg: string;
  inputButtonText: string;

  // Quick actions
  quickActionBg: string;
  quickActionText: string;
  quickActionBorder: string;
  quickActionHover: string;

  // Cards and modals
  cardBg: string;
  cardText: string;
  cardBorder: string;
  cardHighlight: string;
}

export const getThemeForStyle = (styleName: string): Theme => {
  switch (styleName) {
    case "CZ Binance":
      return {
        // Base colors
        primary: "#F0B90B",
        secondary: "#1E2026",
        background: "#313131",
        text: "#EAECEF",
        border: "#2B3139",

        // Header specific
        headerBg: "#0B0E11",
        headerText: "#EAECEF",
        headerIconColor: "#0B0E11",
        headerHighlight: "#F0B90B",
        headerBorder: "#2B3139",

        // Filters section
        filtersBg: "#0B0E11",
        filtersText: "#EAECEF",
        filtersIconColor: "#F0B90B",
        filtersBorder: "#2B3139",
        filtersButtonBg: "#1E2026",
        filtersButtonText: "#EAECEF",
        filtersButtonHover: "#2B3139",

        // Chat panel
        chatBg: "#1A1A1A",
        chatText: "#EAECEF",
        chatBubbleBg: "#F0B90B",
        chatBubbleText: "#0B0E11",
        chatBubbleBotBg: "#1E2026",
        chatBubbleBotText: "#EAECEF",

        // Menu item
        menuItemBg: "#313131",
        menuItemText: "#EAECEF",
        menuItemPrice: "#F0B90B",

        // Input panel
        inputBg: "#1E2026",
        inputText: "#EAECEF",
        inputPlaceholder: "#848E9C",
        inputBorder: "#2B3139",
        inputIconColor: "#848E9C",
        inputButtonBg: "#F0B90B",
        inputButtonText: "#0B0E11",

        // Quick actions
        quickActionBg: "#1E2026",
        quickActionText: "#EAECEF",
        quickActionBorder: "#2B3139",
        quickActionHover: "#2B3139",

        // Cards and modals
        cardBg: "#1E2026",
        cardText: "#EAECEF",
        cardBorder: "#2B3139",
        cardHighlight: "#F0B90B",
      };

    case "Trump":
      return {
        // Base colors
        primary: "#B22234", // Bold Red (Signature color)
        secondary: "#002147", // Deep Blue (Presidential, strong)
        background: "#1A1A1A", // Dark background for depth
        text: "#EAECEF", // Light text for contrast
        border: "#2B3139", // Subtle gray border

        // Header specific
        headerBg: "#002147", // Deep blue header
        headerText: "#EAECEF", // Light text
        headerIconColor: "#FFD700", // Gold for premium effect
        headerHighlight: "#B22234", // Red highlight (Bold statement)
        headerBorder: "#2B3139", // Subtle gray border

        // Filters section
        filtersBg: "#002147", // Dark blue background
        filtersText: "#EAECEF", // Light text
        filtersIconColor: "#FFD700", // Gold icon (Luxury)
        filtersBorder: "#2B3139", // Subtle gray border
        filtersButtonBg: "#B22234", // Red button (Powerful presence)
        filtersButtonText: "#EAECEF", // White text for contrast
        filtersButtonHover: "#8B1C28", // Darker red hover

        // Chat panel
        chatBg: "#1A1A1A", // Dark background
        chatText: "#EAECEF", // Light text
        chatBubbleBg: "#B22234", // Red chat bubble (Powerful, iconic)
        chatBubbleText: "#FFFFFF", // White text for clarity
        chatBubbleBotBg: "#002147", // Deep blue for bot (Presidential tone)
        chatBubbleBotText: "#EAECEF", // Light text

        // Menu item
        menuItemBg: "#2B3139", // Dark background (consistent with theme)
        menuItemText: "#EAECEF", // Light text for readability
        menuItemPrice: "#FFD700", // Gold price (Luxury, premium)

        // Input panel
        inputBg: "#002147", // Dark blue input background
        inputText: "#EAECEF", // Light text
        inputPlaceholder: "#848E9C", // Medium gray placeholder
        inputBorder: "#2B3139", // Subtle gray border
        inputIconColor: "#848E9C", // Medium gray icons
        inputButtonBg: "#B22234", // Red button (Strong presence)
        inputButtonText: "#FFFFFF", // White text for contrast

        // Quick actions
        quickActionBg: "#2B3139", // Dark background
        quickActionText: "#EAECEF", // Light text
        quickActionBorder: "#2B3139", // Subtle border
        quickActionHover: "#B22234", // Red on hover

        // Cards and modals
        cardBg: "#2B3139", // Dark background
        cardText: "#EAECEF", // Light text
        cardBorder: "#2B3139", // Subtle gray border
        cardHighlight: "#FFD700", // Gold for premium feel
      };

    case "Gordon Ramsay":
      return {
        // Base colors
        primary: "#CF142B", // Bold Red (UK Flag + Intensity of Ramsay)
        secondary: "#00247D", // Deep Blue (UK Flag + Authority)
        background: "#1A1A1A", // Dark Kitchen-like background
        text: "#EAECEF", // Light text for readability
        border: "#2B3139", // Subtle gray border

        // Header specific
        headerBg: "#00247D", // Deep blue header (Strong UK branding)
        headerText: "#FFFFFF", // White text for contrast
        headerIconColor: "#FFD700", // Gold (Premium, Michelin-level luxury)
        headerHighlight: "#CF142B", // Red highlight (Bold, passionate)
        headerBorder: "#2B3139", // Subtle gray border

        // Filters section
        filtersBg: "#00247D", // Deep blue background
        filtersText: "#EAECEF", // Light text
        filtersIconColor: "#FFD700", // Gold (Luxury touch)
        filtersBorder: "#2B3139", // Subtle gray border
        filtersButtonBg: "#CF142B", // Red button (Fiery, intense)
        filtersButtonText: "#EAECEF", // Light text for contrast
        filtersButtonHover: "#8B1C28", // Darker red hover (Subtle intensity)

        // Chat panel
        chatBg: "#1A1A1A", // Dark background
        chatText: "#EAECEF", // Light text
        chatBubbleBg: "#CF142B", // Red chat bubble (Passionate, fiery)
        chatBubbleText: "#FFFFFF", // White text for contrast
        chatBubbleBotBg: "#00247D", // Deep blue for bot (Authority, expertise)
        chatBubbleBotText: "#EAECEF", // Light text for contrast

        // Menu item
        menuItemBg: "#2B3139", // Dark background (Kitchen ambiance)
        menuItemText: "#EAECEF", // Light text for contrast
        menuItemPrice: "#FFD700", // Gold (Michelin-star premium quality)

        // Input panel
        inputBg: "#00247D", // Deep blue input background
        inputText: "#EAECEF", // Light text
        inputPlaceholder: "#848E9C", // Medium gray placeholder
        inputBorder: "#2B3139", // Subtle gray border
        inputIconColor: "#848E9C", // Medium gray icons
        inputButtonBg: "#CF142B", // Red button (Bold, attention-grabbing)
        inputButtonText: "#FFFFFF", // White text for contrast

        // Quick actions
        quickActionBg: "#2B3139", // Dark background
        quickActionText: "#EAECEF", // Light text
        quickActionBorder: "#2B3139", // Subtle border
        quickActionHover: "#CF142B", // Red on hover

        // Cards and modals
        cardBg: "#2B3139", // Dark background (Kitchen mood)
        cardText: "#EAECEF", // Light text
        cardBorder: "#2B3139", // Subtle gray border
        cardHighlight: "#FFD700", // Gold (Michelin-star elegance)
      };

    default: // Gobbl default theme
      return {
        // Base colors
        primary: "#EA580B",
        secondary: "#FFF5F2",
        background: "#FFFFFF",
        text: "#1A1A1A",
        border: "#E5E5E5",

        // Header specific
        headerBg: "#FFF5F2",
        headerText: "#1A1A1A",
        headerIconColor: "#EA580B",
        headerHighlight: "#EA580B",
        headerBorder: "#FFE5E5",

        // Filters section
        filtersBg: "#FFFFFF",
        filtersText: "#1A1A1A",
        filtersIconColor: "#EA580B",
        filtersBorder: "#E5E5E5",
        filtersButtonBg: "#F5F5F5",
        filtersButtonText: "#1A1A1A",
        filtersButtonHover: "#E5E5E5",

        // Chat panel
        chatBg: "#FFFFFF",
        chatText: "#1A1A1A",
        chatBubbleBg: "#EA580B",
        chatBubbleText: "#FFFFFF",
        chatBubbleBotBg: "#FFF5F2",
        chatBubbleBotText: "#1A1A1A",

        // Menu item
        menuItemBg: "#e5e5e5", // Dark background (Kitchen ambiance)
        menuItemText: "#000000", // Light text for contrast
        menuItemPrice: "#EA580B", // Gold (Michelin-star premium quality)

        // Input panel
        inputBg: "#FFFFFF",
        inputText: "#1A1A1A",
        inputPlaceholder: "#757575",
        inputBorder: "#E5E5E5",
        inputIconColor: "#EA580B",
        inputButtonBg: "#EA580B",
        inputButtonText: "#FFFFFF",

        // Quick actions
        quickActionBg: "#F5F5F5",
        quickActionText: "#1A1A1A",
        quickActionBorder: "#E5E5E5",
        quickActionHover: "#E5E5E5",

        // Cards and modals
        cardBg: "#FFFFFF",
        cardText: "#1A1A1A",
        cardBorder: "#E5E5E5",
        cardHighlight: "#EA580B",
      };
  }
};
