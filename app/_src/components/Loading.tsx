import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export function Loading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E3A8A" />
    </View>
  );
}

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});


