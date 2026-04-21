import { Tabs } from "expo-router";
import { useFonts } from "expo-font";
import { Syne_700Bold } from "@expo-google-fonts/syne";
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from "@expo-google-fonts/jetbrains-mono";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { theme } from "../theme";

const iconByRoute = {
  index: "home",
  history: "time",
  profile: "person",
  alerts: "notifications",
  insights: "analytics",
};

export default function Layout() {
  const [loaded] = useFonts({
    Syne_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.colors.cyan} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: theme.colors.background },
          headerTitleStyle: { color: theme.colors.text, fontFamily: theme.fonts.heading },
          headerTintColor: theme.colors.text,
          sceneStyle: { backgroundColor: theme.colors.background },
          tabBarStyle: { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border },
          tabBarActiveTintColor: theme.colors.cyan,
          tabBarInactiveTintColor: theme.colors.inactive,
          tabBarLabelStyle: { fontFamily: theme.fonts.body, fontSize: 11 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={iconByRoute[route.name] || "ellipse"} size={size} color={color} />
          ),
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="history" options={{ title: "History" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        <Tabs.Screen name="alerts" options={{ title: "Alerts" }} />
        <Tabs.Screen name="insights" options={{ title: "Insights" }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}
