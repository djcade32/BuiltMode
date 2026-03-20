import { Colors } from '@/constants/theme'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const username = () => {
    return (
        <View style={styles.container}>
            <Text>username</Text>
        </View>
    )
}

export default username

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.primary
    }
})