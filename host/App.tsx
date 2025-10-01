import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator, Platform } from 'react-native';
import { loadRemoteComponent } from './src/remoteLoader';
import FallbackComponent from './components/FallbackComponent';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ExternalComponent, setExternalComponent] = useState<React.ComponentType<{message?: string}> | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
 
  useEffect(() => {
    const loadComponent = async () => {
      if (useLocalFallback) {
        // Don't attempt to load if we're using the local fallback
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const remote = await loadRemoteComponent();
        setExternalComponent(() => remote.ExternalComponent);
      } catch (err) {
        console.error('Failed to load remote component:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    loadComponent();
  }, [useLocalFallback]);
  
  const toggleFallback = () => {
    setUseLocalFallback(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native with External Component</Text>
      
      <Button
        title={useLocalFallback ? "Try Remote Component" : "Use Local Fallback"}
        onPress={toggleFallback}
        color="#4285F4"
      />
      
      <View style={styles.componentContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loadingText}>Loading external component...</Text>
          </View>
        ) : error && !useLocalFallback ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Error loading component: {error}</Text>
            <FallbackComponent message="Using fallback component due to error" />
          </View>
        ) : useLocalFallback ? (
          <>
            <Text style={styles.sectionTitle}>Local Fallback Component:</Text>
            <View style={styles.externalComponentWrapper}>
              <FallbackComponent message="Using local fallback component instead of remote" />
            </View>
          </>
        ) : ExternalComponent ? (
          <>
            <Text style={styles.sectionTitle}>External Component:</Text>
            <View style={styles.externalComponentWrapper}>
              <ExternalComponent />
            </View>
          </>
        ) : (
          <FallbackComponent message="Could not load external component" />
        )}
      </View>

      <Text style={styles.platformInfo}>
        Platform: {Platform.OS} {Platform.Version}
      </Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  componentContainer: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  externalComponentWrapper: {
    width: '100%',
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#add8e6',
    marginBottom: 10,
  },
  platformInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 20,
  },
});
