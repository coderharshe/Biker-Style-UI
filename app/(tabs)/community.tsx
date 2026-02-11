import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Platform,
    Image,
    Dimensions,
    TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';
import Avatar from '@/components/Avatar';
import { communityPosts, currentUser, CommunityPost } from '@/data/mockData';

const { width: SCREEN_W } = Dimensions.get('window');

const SocialPost = ({ post, index }: { post: CommunityPost, index: number }) => {
    const [liked, setLiked] = useState(post.isLiked);
    const [likesCount, setLikesCount] = useState(post.likes);

    const handleLike = () => {
        setLiked(!liked);
        setLikesCount(liked ? likesCount - 1 : likesCount + 1);
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={styles.postContainer}
        >
            <View style={styles.postAvatarSide}>
                <Avatar initials={post.avatar} size={40} color={index % 2 === 0 ? Colors.dark.accent : Colors.dark.secondary} />
                <View style={styles.threadLine} />
            </View>

            <View style={styles.postMainContent}>
                <View style={styles.postHeader}>
                    <View style={styles.authorInfo}>
                        <Text style={styles.authorName}>{post.author}</Text>
                        <Text style={styles.authorHandle}>{post.handle}</Text>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.timestamp}>{post.timestamp}</Text>
                    </View>
                    <Pressable>
                        <Feather name="more-horizontal" size={16} color={Colors.dark.textTertiary} />
                    </Pressable>
                </View>

                <Text style={styles.postContentText}>{post.content}</Text>

                {post.rideStats && (
                    <View style={styles.rideStatsContainer}>
                        <LinearGradient
                            colors={['rgba(255, 107, 44, 0.12)', 'rgba(255, 107, 44, 0.03)']}
                            style={styles.rideStatsGradient}
                        >
                            <View style={styles.statGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{post.rideStats.distance}</Text>
                                    <Text style={styles.statLabel}>Distance</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{post.rideStats.duration}</Text>
                                    <Text style={styles.statLabel}>Time</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{post.rideStats.avgSpeed}</Text>
                                    <Text style={styles.statLabel}>Avg Speed</Text>
                                </View>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statGrid}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{post.rideStats.topSpeed}</Text>
                                    <Text style={styles.statLabel}>Top Speed</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{post.rideStats.fuelEconomy}</Text>
                                    <Text style={styles.statLabel}>Fuel</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{post.rideStats.startTime}</Text>
                                    <Text style={styles.statLabel}>Started</Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                )}

                {post.image && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: post.image }}
                            style={styles.postImage}
                            resizeMode="cover"
                        />
                    </View>
                )}

                <View style={styles.postActions}>
                    <Pressable style={styles.actionBtn} onPress={handleLike}>
                        <Feather
                            name={liked ? "heart" : "heart"}
                            size={18}
                            color={liked ? Colors.dark.sos : Colors.dark.textTertiary}
                            style={liked ? styles.likedIcon : {}}
                        />
                        <Text style={[styles.actionText, liked && { color: Colors.dark.sos }]}>
                            {likesCount}
                        </Text>
                    </Pressable>

                    <Pressable style={styles.actionBtn}>
                        <Feather name="message-circle" size={18} color={Colors.dark.textTertiary} />
                        <Text style={styles.actionText}>{post.comments}</Text>
                    </Pressable>

                    <Pressable style={styles.actionBtn}>
                        <Feather name="repeat" size={18} color={Colors.dark.textTertiary} />
                        <Text style={styles.actionText}>{post.reposts}</Text>
                    </Pressable>

                    <Pressable style={styles.actionBtn}>
                        <Feather name="share" size={18} color={Colors.dark.textTertiary} />
                    </Pressable>
                </View>
            </View>
        </Animated.View>
    );
};

export default function CommunityScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 20 : 0) }]}>
            {/* Top Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.headerTitle}>Timeline</Text>
                </View>
                <View style={styles.headerRight}>
                    <Pressable style={styles.headerIconBtn}>
                        <Feather name="search" size={20} color={Colors.dark.text} />
                    </Pressable>
                    <Pressable style={styles.headerIconBtn}>
                        <Feather name="bell" size={20} color={Colors.dark.text} />
                    </Pressable>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Create Post Area */}
                <View style={styles.createPostArea}>
                    <Avatar initials={currentUser.avatar} size={40} color={Colors.dark.accent} />
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Share your snapshot..."
                            placeholderTextColor={Colors.dark.textTertiary}
                            multiline
                        />
                        <View style={styles.inputActions}>
                            <View style={styles.inputIcons}>
                                <Pressable style={styles.inputIconBtn}>
                                    <Feather name="image" size={20} color={Colors.dark.accent} />
                                </Pressable>
                                <Pressable style={styles.inputIconBtn}>
                                    <Feather name="map-pin" size={20} color={Colors.dark.accent} />
                                </Pressable>
                                <Pressable style={styles.inputIconBtn}>
                                    <Feather name="smile" size={20} color={Colors.dark.accent} />
                                </Pressable>
                            </View>
                            <Pressable style={styles.postBtn}>
                                <Text style={styles.postBtnText}>RIDE OUT</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Feed */}
                {communityPosts.map((post, idx) => (
                    <SocialPost key={post.id} post={post} index={idx} />
                ))}
            </ScrollView>

            {/* Floating Action Button */}
            <Animated.View entering={FadeIn.delay(800)} style={styles.fabContainer}>
                <Pressable style={styles.fab}>
                    <LinearGradient
                        colors={[Colors.dark.accent, '#FF9066']}
                        style={styles.fabGradient}
                    >
                        <Feather name="edit-3" size={24} color="#000" />
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.dark.background,
    },
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerLeft: {},
    headerTitle: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 24,
        color: Colors.dark.text,
        letterSpacing: 1,
    },
    headerRight: {
        flexDirection: 'row',
        gap: 15,
    },
    headerIconBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    scrollContent: {
        flexGrow: 1,
    },
    createPostArea: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    inputWrap: {
        flex: 1,
        gap: 12,
    },
    textInput: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 16,
        color: Colors.dark.text,
        minHeight: 40,
        textAlignVertical: 'top',
    },
    inputActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inputIcons: {
        flexDirection: 'row',
        gap: 16,
    },
    inputIconBtn: {
        padding: 4,
    },
    postBtn: {
        backgroundColor: Colors.dark.accent,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    postBtnText: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 12,
        color: '#000',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 4,
    },
    postContainer: {
        flexDirection: 'row',
        padding: 16,
        paddingRight: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    postAvatarSide: {
        alignItems: 'center',
        gap: 8,
    },
    threadLine: {
        flex: 1,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 1,
        marginVertical: 4,
    },
    postMainContent: {
        flex: 1,
        marginLeft: 12,
        gap: 8,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    authorName: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 16,
        color: Colors.dark.text,
    },
    authorHandle: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 14,
        color: Colors.dark.textTertiary,
    },
    dotSeparator: {
        color: Colors.dark.textTertiary,
        fontSize: 14,
    },
    timestamp: {
        fontFamily: 'Rajdhani_400Regular',
        fontSize: 14,
        color: Colors.dark.textTertiary,
    },
    postContentText: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 15,
        color: Colors.dark.text,
        lineHeight: 20,
        letterSpacing: 0.2,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingRight: 40,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 32,
    },
    actionText: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 13,
        color: Colors.dark.textTertiary,
    },
    likedIcon: {
        textShadowColor: Colors.dark.sos,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 110,
        right: 20,
        zIndex: 100,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: Colors.dark.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    fabGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rideStatsContainer: {
        marginTop: 8,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 44, 0.2)',
    },
    rideStatsGradient: {
        padding: 12,
        gap: 8,
    },
    statGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontFamily: 'Rajdhani_700Bold',
        fontSize: 16,
        color: Colors.dark.accent,
    },
    statLabel: {
        fontFamily: 'Rajdhani_500Medium',
        fontSize: 10,
        color: Colors.dark.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        height: 1,
        backgroundColor: 'rgba(255, 107, 44, 0.1)',
        marginVertical: 4,
    },
});
