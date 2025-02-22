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
        chatBg: "#0B0E11",
        chatText: "#EAECEF",
        chatBubbleBg: "#F0B90B",
        chatBubbleText: "#0B0E11",
        chatBubbleBotBg: "#1E2026",
        chatBubbleBotText: "#EAECEF",

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
        primary: "#B31942",
        secondary: "#0A3161",
        background: "#FFFFFF",
        text: "#0A3161",
        border: "#D8D8D8",

        // Header specific
        headerBg: "#0A3161",
        headerText: "#FFFFFF",
        headerIconColor: "#FFFFFF",
        headerHighlight: "#B31942",
        headerBorder: "#0A3161",

        // Filters section
        filtersBg: "#FFFFFF",
        filtersText: "#0A3161",
        filtersIconColor: "#B31942",
        filtersBorder: "#D8D8D8",
        filtersButtonBg: "#F5F5F5",
        filtersButtonText: "#0A3161",
        filtersButtonHover: "#E5E5E5",

        // Chat panel
        chatBg: "#FFFFFF",
        chatText: "#0A3161",
        chatBubbleBg: "#B31942",
        chatBubbleText: "#FFFFFF",
        chatBubbleBotBg: "#0A3161",
        chatBubbleBotText: "#FFFFFF",

        // Input panel
        inputBg: "#FFFFFF",
        inputText: "#0A3161",
        inputPlaceholder: "#757575",
        inputBorder: "#D8D8D8",
        inputIconColor: "#0A3161",
        inputButtonBg: "#B31942",
        inputButtonText: "#FFFFFF",

        // Quick actions
        quickActionBg: "#F5F5F5",
        quickActionText: "#0A3161",
        quickActionBorder: "#D8D8D8",
        quickActionHover: "#E5E5E5",

        // Cards and modals
        cardBg: "#FFFFFF",
        cardText: "#0A3161",
        cardBorder: "#D8D8D8",
        cardHighlight: "#B31942",
      };

    case "Gordon Ramsay":
      return {
        // Base colors
        primary: "#D4401F",
        secondary: "#1A1A1A",
        background: "#F9F9F9",
        text: "#1A1A1A",
        border: "#E5E5E5",

        // Header specific
        headerBg: "#D4401F",
        headerText: "#FFFFFF",
        headerIconColor: "#FFFFFF",
        headerHighlight: "#FFB800",
        headerBorder: "#D4401F",

        // Filters section
        filtersBg: "#FFFFFF",
        filtersText: "#1A1A1A",
        filtersIconColor: "#D4401F",
        filtersBorder: "#E5E5E5",
        filtersButtonBg: "#F5F5F5",
        filtersButtonText: "#1A1A1A",
        filtersButtonHover: "#E5E5E5",

        // Chat panel
        chatBg: "#F9F9F9",
        chatText: "#1A1A1A",
        chatBubbleBg: "#D4401F",
        chatBubbleText: "#FFFFFF",
        chatBubbleBotBg: "#FFFFFF",
        chatBubbleBotText: "#1A1A1A",

        // Input panel
        inputBg: "#FFFFFF",
        inputText: "#1A1A1A",
        inputPlaceholder: "#757575",
        inputBorder: "#E5E5E5",
        inputIconColor: "#D4401F",
        inputButtonBg: "#D4401F",
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
        cardHighlight: "#D4401F",
      };

    default: // Gobbl default theme
      return {
        // Base colors
        primary: "#f15927",
        secondary: "#FFF5F2",
        background: "#FFFFFF",
        text: "#1A1A1A",
        border: "#E5E5E5",

        // Header specific
        headerBg: "#FFF5F2",
        headerText: "#1A1A1A",
        headerIconColor: "#f15927",
        headerHighlight: "#f15927",
        headerBorder: "#FFE5E5",

        // Filters section
        filtersBg: "#FFFFFF",
        filtersText: "#1A1A1A",
        filtersIconColor: "#f15927",
        filtersBorder: "#E5E5E5",
        filtersButtonBg: "#F5F5F5",
        filtersButtonText: "#1A1A1A",
        filtersButtonHover: "#E5E5E5",

        // Chat panel
        chatBg: "#FFFFFF",
        chatText: "#1A1A1A",
        chatBubbleBg: "#f15927",
        chatBubbleText: "#FFFFFF",
        chatBubbleBotBg: "#FFF5F2",
        chatBubbleBotText: "#1A1A1A",

        // Input panel
        inputBg: "#FFFFFF",
        inputText: "#1A1A1A",
        inputPlaceholder: "#757575",
        inputBorder: "#E5E5E5",
        inputIconColor: "#f15927",
        inputButtonBg: "#f15927",
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
        cardHighlight: "#f15927",
      };
  }
};
