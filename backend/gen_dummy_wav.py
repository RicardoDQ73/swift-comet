import wave
import math
import struct

def generate_wav(filename, duration=20):
    sample_rate = 44100
    num_samples = duration * sample_rate
    frequency = 440.0
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(num_samples):
            value = int(32767.0 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
            data = struct.pack('<h', value)
            wav_file.writeframes(data)

generate_wav('dummy_voice.wav')
print("Created dummy_voice.wav")
