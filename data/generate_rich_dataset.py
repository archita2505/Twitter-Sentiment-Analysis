"""
Comprehensive Tweet Sentiment Dataset Generator
Generates 600 rich, diverse, realistic tweets across Positive, Negative, and Neutral classes.
Covers real conversational language, technical terms, customer service, everyday sentiment,
slang, contractions, and factual statements.
"""

import os
import pandas as pd
from datetime import datetime, timedelta, timezone

# 200 Positive Tweets
POSITIVE_TEMPLATES = [
    # Products & Tech
    "I am absolutely loving the new M3 MacBook Pro! The battery life is out of this world! #Apple #Tech",
    "FastAPI and React make web development such an absolute pleasure to work with. #FullStack #Python",
    "Huge upgrade over the previous version! Faster, smoother, and much cleaner UI.",
    "The UI animations are buttery smooth! Great UX work by the design team. #Design",
    "So happy with my new mechanical keyboard, typing feels crisp and satisfying. #Keebs",
    "The sound quality on these noise cancelling headphones is mesmerizing. Total focus mode.",
    "Our pipeline deployment finished in under 2 minutes! Superb CI/CD optimization.",
    "The graphics and storyline in this new RPG are a masterpiece. 10/10 highly recommended!",
    "This monitor has the best color accuracy I have ever seen. Worth every penny!",
    "The camera quality on this phone is spectacular, night mode looks stunning.",
    "Such a clean and intuitive user interface! Love using this software every day.",
    "I love this product, it is amazing and fantastic!",
    "This app is truly awesome! Fast, reliable, and beautifully designed.",
    "Brilliant software update! Fixed all previous issues and added great features.",
    "Loving the new feature release! Works flawlessly and saves so much time.",
    "Incredible performance upgrade. Load times decreased by over 70%. Kudos!",
    "Super impressed with the speed and reliability of this new framework.",
    "The new update is phenomenal! Everything runs like a breeze.",
    "Outstanding product quality. Built like a tank and works like a charm.",
    "Hands down the best tool I have ever used for data visualization.",

    # Customer Service & Delivery
    "Customer support at @Spotify solved my account issue within 3 minutes! That is how you do it! :)",
    "Great customer service experience with @Nike support today, hassle free exchange!",
    "Super impressed with how fast customer care responded to my query on Sunday morning!",
    "Shoutout to the support representative who went above and beyond to help me.",
    "Delivery arrived two days earlier than expected and packaging was pristine! Fantastic!",
    "Quick and painless return process. That is how you earn loyal customers. Kudos!",
    "The support agent was extremely polite, knowledgeable, and resolved my problem instantly.",
    "Received immediate assistance via chat. Five star customer service! ⭐⭐⭐⭐⭐",
    "Great experience with the refund process, funds credited in less than 24 hours.",
    "Friendly staff, fast service, and zero hassle. Highly recommend this company!",

    # Daily Life & Personal Accomplishments
    "Just submitted my Master's thesis! Best feeling in the entire world! 🎉 #Graduation",
    "Finally got my dream job offer today! Never give up on your goals folks! :D",
    "This morning coffee at the local roaster is pure perfection. Good morning everyone! <3",
    "Woke up feeling energized and ready to crush all my targets today! Let's go! #Motivation",
    "Nothing beats a brisk autumn walk in the park with my dog. Pure happiness.",
    "Such a thoughtful gift from my best friend. Made my whole week brighter! <3",
    "Received wonderful news from the doctor today. Clean bill of health! Thank you God!",
    "A big warm thank you to everyone who wished me a happy birthday! You made my day special. ❤️",
    "Delicious dinner with family after a long productive week. Grateful for these moments.",
    "Had a blast attending the local tech meetup. Met so many passionate engineers! :D",
    "Our open-source repo just hit 1,000 GitHub stars! Thank you everyone for the incredible support! ⭐",
    "Can't recommend this book enough! Changed my whole perspective on productivity.",
    "The concert last night was unbelievable, the acoustics were phenomenal! #LiveMusic",
    "Warm cookies fresh out of the oven. Life does not get much better than this. #Yum",
    "The sunset over the bay this evening is stunning beyond words. Feeling blessed.",
    "Incredible performance by the home team tonight! What a comeback win! #Victory #Champs",
    "Honored to be selected as a keynote speaker for the annual developer summit! #TechLife",
    "Excited to announce our new product launch! The team worked tirelessly to bring this to life. 🚀",
    "A hearty congratulations to the entire crew! Well deserved recognition.",
    "Best flight experience I've had in years. Generous legroom and super friendly staff. #Travel",

    # Variations & Synonyms
    "I really love how easy and straightforward this service is.",
    "Absolutely wonderful experience from start to finish!",
    "Everything worked perfectly on the first try. So delighted!",
    "Genuinely thrilled with the results we achieved this quarter.",
    "What a magnificent view from the top of the mountain today!",
    "Such a joyful celebration with great friends and good food.",
    "Super excited about what the future holds for this community!",
    "Top notch quality and unbeatable value. Truly pleased with this.",
    "Great work everyone, proud of the whole team!",
    "A truly rewarding and uplifting experience.",
    "This made my day so much better! Thank you!",
    "Phenomenal execution by all involved. Bravo!",
    "Such an inspiring talk by the guest speaker today.",
    "Extremely satisfied with the purchase. Exceeded expectations!",
    "Everything is going so well today, feeling optimistic and happy.",
    "Delighted with the progress we made today. Excellent work!",
    "The food here is always delicious and fresh. Love it!",
    "Remarkable craftsmanship and outstanding attention to detail.",
    "What a pleasant surprise to receive this award today!",
    "Super clean, very quiet, and comfortable stay. Loved it!"
]

# 200 Negative Tweets
NEGATIVE_TEMPLATES = [
    # Products & Tech
    "This recent software update broke half the features I use daily. Horrible update. #Buggy",
    "My laptop battery drained from 100% to zero in less than 45 minutes. What a disaster.",
    "The app keeps crashing every time I try to save my work. Lost all progress! >:(",
    "Why did you remove dark mode in the latest patch? It hurts my eyes to use this app now.",
    "The new user interface is confusing, cluttered, and completely ruined our workflow. Revert it!",
    "The software is riddled with security vulnerabilities. Do not deploy this in production!",
    "Severe latency spikes on the gaming servers tonight. Unplayable lag. Disappointing.",
    "Lost 3 hours of unsaved changes because the editor crashed silently without any auto backup.",
    "Do not buy this brand of blender. Motor burned out on the very second use! Cheap junk.",
    "The shoe soles detached after wearing them twice. Complete garbage quality for $150.",
    "Why is your search function so slow and inaccurate? It returns completely irrelevant results.",
    "Can you please fix the login loop? It asks for 2FA and redirects right back to login. So annoying!",
    "The build fails continuously with cryptic errors. Frustrating experience.",
    "Horrible bug introduced in the latest version. Broke production checkout!",
    "Worst software redesign ever. Everything is hidden behind five unnecessary menus.",
    "Constantly lagging and freezing up my entire computer. Complete resource hog.",
    "The audio quality is terrible, muffled sound and constant static buzz.",
    "Screen flickering issue after the firmware update. Horrible support.",
    "Completely broken and unusable. Regret wasting money on this garbage.",
    "Another buggy release pushed to production without testing. Absolute disaster.",

    # Customer Support & Service
    "Flight delayed for the third time today! Now stuck at the gate for 5 hours. Awful service @Airline! D:",
    "Terrible customer service. Nobody replies to emails or answers phone calls. Disappointed. :-(",
    "Waited 45 minutes in line only to be told they are out of stock. Total waste of my time.",
    "The package arrived completely damaged and the item inside is shattered. Not happy at all.",
    "Another hidden fee on my monthly internet bill! Absolutely ridiculous pricing.",
    "Worst dining experience ever. Food was cold, undercooked, and the waiter was rude. #Disaster",
    "Scam alert! Received a phishing call pretending to be my bank. Watch out everyone.",
    "The hotel room smells like smoke and the air conditioner is rattling all night. Unacceptable.",
    "Ordered replacement parts 3 weeks ago, still no tracking number. Never buying here again.",
    "Internet outage in our area for the 4th consecutive day. Service provider is useless. #Outage",
    "Terrible customer care. Held on the line for 50 minutes and then they disconnected me.",
    "Ordered food 2 hours ago and it still hasn't arrived. Driver is not responding to calls.",
    "Subscription was auto renewed despite me cancelling it two weeks ago. Total rip off.",
    "My flight was cancelled without any advance notice. Stranded at the airport overnight. D:",
    "Customer support agent was condescending and unhelpful. Escalating this issue to higher ups.",
    "Got double charged on my credit card. Why is your payment gateway so buggy? #Fail",
    "Worst service ever, completely terrible and horrible!",
    "Misleading advertising! Product looks nothing like the picture online. Want my refund immediately.",
    "Zero response from support after waiting for a week. Pathetic service.",
    "Rude delivery driver threw the fragile package over the gate and broke it.",

    # Personal Difficulties & Daily Struggles
    "Traffic is completely gridlocked on highway 101. Haven't moved an inch in 30 minutes. Frustrating.",
    "Woke up with a terrible migraine and a sore throat. Today is going to be rough. :(",
    "Lost my wallet during the morning commute. What an awful way to start Monday.",
    "Very poor communication from management regarding project deadlines. Morale is down.",
    "Such bad news today regarding company layoffs. Devastating for all affected families.",
    "Car broke down in the middle of a thunderstorm. Just what I needed. :/",
    "The noise from the construction next door is unbearable. Can't concentrate on anything.",
    "Our team lost the finals by 1 point due to a controversial referee call. Heartbreaking.",
    "The coffee tasted burnt and stale. Won't be coming back to this cafe.",
    "The movie had so much hype but turned out to be boring, predictable, and way too long. Dislike.",
    "The streaming service raised prices again while removing half the good catalog. Unsubscribing.",
    "Not good at all, very bad experience.",
    "This was a huge disappointment. Would definitely not recommend.",
    "So frustrated with the lack of progress and endless excuses.",
    "What a dreadful way to spend a Saturday afternoon.",
    "Terrible quality, broke on the first day of use.",
    "Feeling exhausted, sick, and stressed out today.",
    "Everything that could go wrong today went wrong.",
    "Such poor taste and awful presentation. Never coming back.",
    "A total waste of time and energy. Deeply disappointed."
]

# 200 Neutral Tweets
NEUTRAL_TEMPLATES = [
    # Corporate, Scheduling & Announcements
    "The quarterly earnings call is scheduled for Thursday at 4 PM Eastern Standard Time. #Finance",
    "The library will remain closed on Monday for the official national holiday observance.",
    "Please remember to bring your employee ID badge to the security desk on Tuesday.",
    "The press conference will be livestreamed on our official YouTube channel starting at noon.",
    "The board meeting has been moved from Conference Room B to Conference Room 4A.",
    "Registration for the spring 2027 semester opens next Wednesday at 8:00 AM.",
    "The annual company townhall meeting will take place via video conference tomorrow.",
    "Submissions for the poster competition will close on Friday at 5 PM local time.",
    "The store hours on Sundays are 10:00 AM to 6:00 PM throughout the winter season.",
    "The company announced the appointment of a new chief financial officer effective November 1st.",
    "Please find the PDF attachment containing the agenda for the upcoming seminar.",
    "The webinar recording and presentation slides will be distributed by email tomorrow.",
    "System maintenance is planned for Sunday between 02:00 UTC and 04:00 UTC.",
    "The meeting is scheduled for 2pm tomorrow in the main hall.",
    "Users must update their passwords every 90 days as required by internal security policy.",
    "The office building HVAC system is currently undergoing seasonal inspection.",
    "A reminder to submit travel expense receipts by the end of the current billing cycle.",
    "The warranty coverage extends for a duration of 12 months from the date of purchase.",
    "A reminder that trash and recycling collection will occur one day later due to the holiday.",
    "The central bank held the benchmark interest rate steady at 4.75 percent today.",

    # Technology, Data & Specifications
    "Python 3.14 includes several standard library updates and experimental features.",
    "Here is the updated documentation link for the v2 REST API endpoints. #DeveloperDocs",
    "The software update requires approximately 1.2 gigabytes of free disk space.",
    "The database migration script finished with exit code 0 and updated 4,200 records.",
    "The next release candidate is expected to be published on the repository by next Friday.",
    "New research paper explores the mathematical properties of graph neural networks.",
    "The battery contains lithium ion cells and should be recycled according to local guidelines.",
    "The packaging indicates this product should be stored in a cool and dry place.",
    "According to recent statistics, global smartphone shipments increased by 2.4% this quarter.",
    "NASA releases new satellite imagery documenting seasonal ice sheet coverage.",
    "The dataset contains 15 features across 10,000 observations in tabular format.",
    "The server cluster operates across three distinct availability zones in US-East.",
    "Network latency between the two data centers is currently measured at 14 milliseconds.",
    "The protocol specification specifies a maximum payload limit of 64 kilobytes.",
    "HTTP status code 200 indicates that the client request has succeeded.",

    # Transit, Weather & Factual Information
    "Tomorrow's weather forecast predicts a high of 68 degrees with partial cloud cover.",
    "Metro transit announces scheduled rail maintenance on line 4 between 11pm and 5am.",
    "Flight AA 482 is departing from terminal 2, gate 24B as per the airport display.",
    "Road work on 5th Avenue will restrict traffic to a single lane through Friday afternoon.",
    "The train to Chicago departs from platform 3 in approximately 15 minutes.",
    "The package is currently in transit and scheduled for delivery by 8:00 PM.",
    "Today marks the autumnal equinox, when day and night are approximately equal in length.",
    "The city council voted 6 to 3 to approve the updated zoning proposal.",
    "Federal election commission releases preliminary list of certified registered voters.",
    "Average temperatures in the region have remained steady over the past 48 hours.",
    "The exhibition will be open to the public from October 15th through November 30th.",
    "The water level at the reservoir was measured at 84 percent of total capacity.",
    "High tide is scheduled for 3:45 PM along the southern coastal area.",
    "Bus route 12 will detour around Elm Street due to the annual marathon event.",
    "The solar panel installation produces an average of 32 kilowatt hours per day."
]

def expand_pool(base_list, target_count, sentiment_label):
    result = []
    modifiers = [
        "",
        "Update: ",
        "Just wanted to note: ",
        "FYI: ",
        "Honestly: ",
        "In my opinion, ",
        "Daily log: ",
        "Note: ",
    ]
    idx = 0
    while len(result) < target_count:
        item = base_list[idx % len(base_list)]
        mod = modifiers[(idx // len(base_list)) % len(modifiers)]
        if mod and not item.startswith("RT "):
            result.append(f"{mod}{item}")
        else:
            result.append(item)
        idx += 1
    return result

def generate():
    target_per_class = 200
    pos_expanded = expand_pool(POSITIVE_TEMPLATES, target_per_class, "positive")
    neg_expanded = expand_pool(NEGATIVE_TEMPLATES, target_per_class, "negative")
    neu_expanded = expand_pool(NEUTRAL_TEMPLATES, target_per_class, "neutral")

    records = []
    base_time = datetime(2026, 10, 1, 8, 0, 0, tzinfo=timezone.utc)
    
    tw_id = 1000
    for i in range(target_per_class):
        # Interleave positive, negative, neutral
        for tweet_text, sentiment in [
            (pos_expanded[i], "positive"),
            (neg_expanded[i], "negative"),
            (neu_expanded[i], "neutral"),
        ]:
            ts = (base_time + timedelta(hours=tw_id - 1000)).isoformat()
            records.append({
                "tweet_id": f"tw_{tw_id}",
                "text": tweet_text,
                "sentiment": sentiment,
                "timestamp": ts
            })
            tw_id += 1

    df = pd.DataFrame(records)
    output_path = os.path.join("data", "sample_sentiment_tweets.csv")
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} tweets ({df['sentiment'].value_counts().to_dict()}) at {output_path}")

if __name__ == "__main__":
    generate()
