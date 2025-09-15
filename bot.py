# bot.py

import sys
import json

def process_message(message: str):
    # Example: just reverse + length
    return {
        "processed": f"{message[::-1]} (len={len(message)})"
    }

if __name__ == "__main__":
    user_message = sys.stdin.read().strip()
    result = process_message(user_message)
    print(json.dumps(result))


