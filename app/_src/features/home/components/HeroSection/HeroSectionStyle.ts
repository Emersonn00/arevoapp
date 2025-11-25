import { Dimensions, StyleSheet } from "react-native";

const height = Dimensions.get("window")


export const heroSectionStyles = StyleSheet.create({
  background: {
    height: height.height /1.2,
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 20,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  actions: {
    marginTop: 32,
    alignSelf: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  outlineButton: {
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'transparent',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: '#1D4ED8',
  },
  outlineText: {
    color: '#FFFFFF',
  },
  highlights: {
    marginTop: 36,
    flexDirection: 'row',
    gap: 16,
  },
  highlightCard: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    gap: 6,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highlightDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
});