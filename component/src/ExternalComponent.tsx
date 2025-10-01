import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

export interface ExternalComponentProps {
  message?: string;
}

export const ExternalComponent: React.FC<ExternalComponentProps> = ({ message = 'Hello from External Component!' }) => {

  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState<string>("Loading...");
  const isMountedRef = React.useRef(false);

  const fetchData = async () => {
    try {
        const response = await fetch('https://api.restful-api.dev/objects/7');
        const json = await response.json();
        setData(json.name);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isMountedRef.current) return;
    isMountedRef.current = true;
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
            <Text style={styles.text}>{message}</Text>
            <Text style={styles.text}>Fetched Data: {data}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0097a7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: '#006064',
    fontWeight: 'bold',
  },
});

export default ExternalComponent;