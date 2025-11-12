import { useEffect } from 'react';
import { Tabs, useRouter } from "expo-router";
import { Platform, View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Search, PlusCircle, Briefcase, User, MessageCircle, MessageSquare } from "lucide-react-native";
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null;
  }

  const handleContactPress = () => {
    const phoneNumber = '2028237791';
    const smsUrl = Platform.select({
      ios: `sms:${phoneNumber}`,
      android: `sms:${phoneNumber}`,
      default: `sms:${phoneNumber}`,
    });
    Linking.openURL(smsUrl);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 32,
          paddingHorizontal: 8,
          height: Platform.OS === 'ios' ? 110 : 94,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600' as const,
          marginBottom: Platform.OS === 'ios' ? 0 : 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground}>
            <TouchableOpacity 
              style={styles.contactBanner}
              onPress={handleContactPress}
              activeOpacity={0.7}
            >
              <MessageSquare size={14} color="#6B7280" />
              <Text style={styles.contactText}>
                Questions or concerns? Text 202-823-7791
              </Text>
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Browse",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "Post",
          tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-bounties"
        options={{
          title: "My Bounties",
          tabBarIcon: ({ color }) => <Briefcase size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contactBanner: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    backgroundColor: '#F3F4F6',
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contactText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
});
