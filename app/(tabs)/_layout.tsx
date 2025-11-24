import { Tabs } from 'expo-router';


export default function TabLayout(): JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
     <Tabs.Screen
        name="home"
        options={{
          title: 'Tab One',
        }}
      />
    </Tabs>
  );
}


