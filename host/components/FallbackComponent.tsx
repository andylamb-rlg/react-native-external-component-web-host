import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FallbackComponentProps {
  message?: string;
}

const FallbackComponent: React.FC<FallbackComponentProps> = ({ message = 'Fallback Component' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#ffcccc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: '#800000',
    fontWeight: 'bold',
  },
});

export default FallbackComponent;