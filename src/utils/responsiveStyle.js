// utils/responsiveStyles.js
import {StyleSheet} from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
  responsiveFontSize,
  responsiveWidth,
  responsiveHeight,
  spacing,
  cardDimensions,
  searchBarHeight,
  deviceInfo,
  getGridColumns,
} from './responsive';

// Create responsive styles
export const createResponsiveStyles = styles => {
  const responsiveStyles = {};

  Object.keys(styles).forEach(key => {
    const style = styles[key];
    const responsiveStyle = {};

    Object.keys(style).forEach(property => {
      const value = style[property];

      switch (property) {
        // Font sizes
        case 'fontSize':
          responsiveStyle[property] = responsiveFontSize(value);
          break;

        // Dimensions
        case 'width':
        case 'height':
        case 'minWidth':
        case 'minHeight':
        case 'maxWidth':
        case 'maxHeight':
          if (typeof value === 'string' && value.includes('%')) {
            responsiveStyle[property] = value;
          } else if (typeof value === 'number') {
            responsiveStyle[property] = scale(value);
          } else {
            responsiveStyle[property] = value;
          }
          break;

        // Spacing properties
        case 'margin':
        case 'marginTop':
        case 'marginBottom':
        case 'marginLeft':
        case 'marginRight':
        case 'marginHorizontal':
        case 'marginVertical':
        case 'padding':
        case 'paddingTop':
        case 'paddingBottom':
        case 'paddingLeft':
        case 'paddingRight':
        case 'paddingHorizontal':
        case 'paddingVertical':
          if (typeof value === 'number') {
            responsiveStyle[property] = scale(value);
          } else {
            responsiveStyle[property] = value;
          }
          break;

        // Border radius
        case 'borderRadius':
        case 'borderTopLeftRadius':
        case 'borderTopRightRadius':
        case 'borderBottomLeftRadius':
        case 'borderBottomRightRadius':
          if (typeof value === 'number') {
            responsiveStyle[property] = moderateScale(value);
          } else {
            responsiveStyle[property] = value;
          }
          break;

        // Line height
        case 'lineHeight':
          if (typeof value === 'number') {
            responsiveStyle[property] = responsiveFontSize(value);
          } else {
            responsiveStyle[property] = value;
          }
          break;

        default:
          responsiveStyle[property] = value;
          break;
      }
    });

    responsiveStyles[key] = responsiveStyle;
  });

  return StyleSheet.create(responsiveStyles);
};

// Pre-defined responsive styles for common components
export const commonResponsiveStyles = createResponsiveStyles({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: 0,
    width: '100%',
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#777',
    paddingRight: 7,
    width: '100%',
    height: searchBarHeight,
  },

  searchInput: {
    flex: 1,
    height: searchBarHeight,
    paddingLeft: 15,
    paddingRight: 45,
    paddingVertical: 0,
    textAlignVertical: 'center',
    fontSize: responsiveFontSize(14),
    width: '85%',
  },

  searchIcon: {
    padding: 10,
    marginLeft: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
  },

  cardContainer: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    minHeight: 200,
  },

  card: {
    width: cardDimensions.width,
    margin: spacing.xs,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: cardDimensions.minHeight,
  },

  cardImage: {
    width: '100%',
    height: deviceInfo.isTablet ? scale(120) : scale(100),
    resizeMode: 'cover',
    borderRadius: 5,
  },

  cardText: {
    marginTop: spacing.xs,
    fontSize: responsiveFontSize(14),
    fontWeight: 'bold',
    textAlign: 'center',
  },

  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: 0,
  },

  headingText: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
  },

  moreText: {
    fontSize: responsiveFontSize(16),
    color: '#F48221',
    fontWeight: 'bold',
  },

  // Stock card styles
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  stockHeader: {
    flexDirection: 'row',
    padding: spacing.sm,
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  itemNameText: {
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  categoryText: {
    fontSize: responsiveFontSize(14),
    fontWeight: 'bold',
    color: '#007BFA',
  },

  detailLabel: {
    color: '#F48221',
    fontSize: responsiveFontSize(14),
    fontWeight: '600',
    marginBottom: 4,
  },

  detailValue: {
    color: '#1F2937',
    fontSize: responsiveFontSize(14),
    fontWeight: '500',
  },

  lotNoLabel: {
    color: 'black',
    fontSize: responsiveFontSize(16),
    fontWeight: 'bold',
    marginRight: 4,
  },

  lotNoValue: {
    color: '#FFFFFF',
    fontSize: responsiveFontSize(16),
    fontWeight: '700',
    textAlign: 'center',
  },
});
