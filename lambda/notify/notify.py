from __future__ import print_function
import datetime
import json
import os
import requests
from utils.utils_dates import calc_prev_month_start


def findings_message(json_data):

    try:
        findings = json_data["Findings"]

        teams_message = [
            {"name": "------------------", "value": "---"},
            {"name": "유형", "value": "취약 도메인 ({}개)".format(len(findings))},
            {"name": "------------------", "value": "---"}
        ]

        for idx, finding in enumerate(findings):
            teams_message.append({"name": "순번", "value": "{}".format(idx + 1)})
            teams_message.append({"name": "AWS Account", "value": findings['Account']})
            teams_message.append({"name": "도메인/주소", "value": findings['Domain']})
            teams_message.append({"name": "------------------", "value": "---"})

        print(teams_message)
        return teams_message

    except KeyError:

        return None


def takeovers_message(json_data):

    try:
        takeovers = json_data["Takeovers"]

        teams_message = [
            {"name": "------------------", "value": "---"},
            {"name": "유형", "value": "도메인 자체 Takeovers ({}개)".format(len(takeovers))},
            {"name": "------------------", "value": "---"}
        ]

        for idx, takeover in enumerate(takeovers):
            teams_message.append({"name": "순번", "value": "{}".format(idx + 1)})

            teams_message.append({"name": "Takeover AWS 어카운트", "value": takeover['TakeoverAccount']})
            teams_message.append({"name": "취약 AWS 어카운트", "value": takeover['VulnerableAccount']})
            teams_message.append({"name": "리소스 유형", "value": takeover['ResourceType']})
            teams_message.append({"name": "도메인/주소", "value": takeover['VulnerableDomain']})
            teams_message.append({"name": "Self-takeover 도메인/주소", "value": takeover['TakeoverDomain']})

            if takeover["TakeoverStatus"] == "success":
                teams_message.append({"name": "상태", "value": "성공"})

            if takeover["TakeoverStatus"] == "failure":
                teams_message.append({"name": "상태", "value": "실패"})

            teams_message.append({"name": "------------------", "value": "---"})

        print(teams_message)
        return teams_message

    except KeyError:

        return None


def resources_message(json_data):

    try:
        stacks = json_data["Resources"]

        teams_message = [
            {"name": "------------------", "value": "---"},
            {"name": "유형", "value": "탈취 대응 리소스 ({}개)".format(len(stacks))},
            {"name": "------------------", "value": "---"}
        ]
        resource_name = resource_type = takeover_account = vulnerable_account = vulnerable_domain = ""

        for idx, tags in enumerate(stacks):
            for tag in tags:
                if tag["Key"] == "ResourceName":
                    resource_name = tag["Value"]

                elif tag["Key"] == "ResourceType":
                    resource_type = tag["Value"]

                elif tag["Key"] == "TakeoverAccount":
                    takeover_account = tag["Value"]

                elif tag["Key"] == "VulnerableAccount":
                    vulnerable_account = tag["Value"]

                elif tag["Key"] == "VulnerableDomain":
                    vulnerable_domain = tag["Value"]

            teams_message.append({"name": "순번", "value": "{}".format(idx + 1)})
            teams_message.append({"name": "Takeover AWS 어카운트", "value": takeover_account})
            teams_message.append({"name": "취약 AWS 어카운트", "value": vulnerable_account})
            teams_message.append({"name": "리소스 유형", "value": resource_type})
            teams_message.append({"name": "리소스 이름", "value": resource_name})
            teams_message.append({"name": "취약 도메인/주소", "value": vulnerable_domain})
            teams_message.append({"name": "------------------", "value": "---"})

        teams_message.append(
            {
                "name": "권고",
                "value": "DNS를 점검한 후 (CNAME 삭제 등) 리소스와 CloudFormation Stack을 삭제하십시요."
            }
        )
        print(teams_message)
        return teams_message

    except KeyError:
        return None

def fixed_message(json_data):

    try:
        fixes = json_data["Fixed"]

        teams_message = [
            {"name": "------------------", "value": "---"},
            {"name": "유형", "value": "조치되거나 자체 Takeover된 도메인 ({}개)".format(len(fixes))},
            {"name": "------------------", "value": "---"}
        ]

        for idx, fix in enumerate(fixes):
            teams_message.append({"name": "순번", "value": "{}".format(idx + 1)})
            teams_message.append({"name": "AWS Account", "value": fix['Account']})
            teams_message.append({"name": "도메인/주소", "value": fix['Domain']})
            teams_message.append({"name": "------------------", "value": "---"})

        print(teams_message)
        return teams_message

    except KeyError:

        return None


def current_message(json_data):

    try:
        vulnerabilities = json_data["Current"]

        teams_message = [
            {"name": "------------------", "value": "---"},
            {"name": "유형", "value": "취약 도메인 ({}개)".format(len(vulnerabilities))},
            {"name": "------------------", "value": "---"}
        ]

        for idx, vulnerability in enumerate(vulnerabilities):
            teams_message.append({"name": "순번", "value": "{}".format(idx + 1)})
            teams_message.append({"name": "AWS Account", "value": vulnerability['Account']})
            teams_message.append({"name": "리소스 유형", "value": vulnerability['ResourceType']})
            teams_message.append({"name": "취약점 유형", "value": vulnerability['VulnerabilityType']})
            teams_message.append({"name": "도메인/주소", "value": vulnerability['Domain']})
            teams_message.append({"name": "------------------", "value": "---"})

        print(teams_message)
        return teams_message

    except KeyError:

        return None


def new_message(json_data):

    try:
        vulnerabilities = json_data["New"]

        teams_message = [
            {"name": "------------------", "value": "---"},
            {"name": "유형", "value": "새 취약 도메인 ({}개)".format(len(vulnerabilities))},
            {"name": "------------------", "value": "---"}
        ]

        for idx, vulnerability in enumerate(vulnerabilities):
            teams_message.append({"name": "순번", "value": "{}".format(idx + 1)})
            teams_message.append({"name": "AWS 어카운트", "value": vulnerability['Account']})
            teams_message.append({"name": "리소스 유형", "value": vulnerability['ResourceType']})
            teams_message.append({"name": "취약점 유형", "value": vulnerability['VulnerabilityType']})
            teams_message.append({"name": "도메인/주소", "value": vulnerability['Domain']})
            teams_message.append({"name": "자체(Self) Takeover 주소", "value": vulnerability['Takeover']})
            teams_message.append({"name": "------------------", "value": "---"})

        teams_message.append({"name": "자동 조치", "value": "Self-Takeover 프로세스가 자동으로 시작되었습니다. 잠시 후 해당 리소스를 확인하세요."})
        print(teams_message)
        return teams_message

    except KeyError:

        return None


def build_markdown_block(text):
    return {"type": "section", "text": {"type": "mrkdwn", "text": text}}


def monthly_stats_message(json_data):
    last_month = calc_prev_month_start(datetime.datetime.now())
    last_month_year_text = last_month.strftime("%B %Y")
    last_year_text = last_month.strftime("%Y")

    teams_message = [
        {"name": "------------------", "value": "---"},
        {"name": "유형", "value": "월간 리포트"},
        {"name": "------------------", "value": "---"}
    ]

    try:
        # Sanghyoun: Markdown format for later use.
        # blocks = [
        #     build_markdown_block(f"Total new findings for {last_month_year_text}: *{json_data['LastMonth']}*"),
        #     build_markdown_block(f"Total new findings for {last_year_text}: *{json_data['LastYear']}*"),
        #     build_markdown_block(f"Total findings all time: *{json_data['Total']}*"),
        # ]
        # return {"blocks": blocks}
        teams_message.append({"name": f"전월({last_month_year_text}) 신규 발견 건수", "value": f"*{json_data['LastMonth']}*"})
        teams_message.append({"name": f"전년({last_year_text}) 신규 발견 건수", "value": f"*{json_data['LastYear']}*"})
        teams_message.append({"name": "전체 신규 발견 건수", "value": f"*{json_data['Total']}*"})
        teams_message.append({"name": "------------------", "value": "---"})

        print(teams_message)
        return teams_message
    except KeyError:
        return None


def lambda_handler(event, context):  # pylint:disable=unused-argument

    teams_url = os.environ["TEAMS_WEBHOOK_URL"]
    teams_channel = os.environ["TEAMS_CHANNEL"]
    teams_emoji = os.environ["TEAMS_EMOJI"]
    teams_fix_emoji = os.environ["TEAMS_FIX_EMOJI"]
    teams_new_emoji = os.environ["TEAMS_NEW_EMOJI"]

    print(json.dumps(event["Records"][0]["Sns"]))

    teams_message = {}
    subject = event["Records"][0]["Sns"]["Subject"]

    # Slack payload.
    # payload = {
    #     "channel": teams_channel,
    #     "icon_emoji": teams_emoji,
    #     "attachments": [],
    #     "text": subject,
    # }

    # Microsoft Teams payload
    payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": subject,
        "sections": [
            {
                "activityTitle": subject,   # Default to the subject, which will be appended later with emoji icons.
                "activitySubtitle": "SCK 사이렌 플랫폼",
                "activityImage": "https://www.starbucks.co.kr/common/img/common/logo.png",
                "facts": [],
                "markdown": True
            }
        ]
    }

    message = event["Records"][0]["Sns"]["Message"]
    json_data = json.loads(message)

    if findings_message(json_data) is not None:
        teams_message = findings_message(json_data)

    elif takeovers_message(json_data) is not None:
        teams_message = takeovers_message(json_data)

    elif resources_message(json_data) is not None:
        teams_message = resources_message(json_data)

    elif current_message(json_data) is not None:
        teams_message = current_message(json_data)

    elif new_message(json_data) is not None:
        teams_message = new_message(json_data)
        # payload["icon_emoji"] = teams_new_emoji
        payload["sections"][0]["activityTitle"] = "{}{}{}".format(teams_new_emoji, subject, teams_new_emoji)

    elif fixed_message(json_data) is not None:
        teams_message = fixed_message(json_data)
        # payload["icon_emoji"] = teams_fix_emoji
        payload["sections"][0]["activityTitle"] = "{}{}{}".format(teams_fix_emoji, subject, teams_fix_emoji)

    elif monthly_stats_message(json_data) is not None:
        teams_message = monthly_stats_message(json_data)
        # payload["icon_emoji"] = teams_fix_emoji
        payload["sections"][0]["activityTitle"] = "{}{}{}".format(teams_fix_emoji, subject, teams_fix_emoji)

    if len(teams_message) > 0:
        # payload["attachments"].append(teams_message)
        payload["sections"][0]["facts"] = teams_message

    print(json.dumps(payload, sort_keys=True, indent=2))

    response = requests.post(
        teams_url,
        data=json.dumps(payload),
        headers={"Content-Type": "application/json"},
    )

    if response.status_code != 200:
        ValueError(f"Request to Teams returned error {response.status_code}:\n{response.text}")

    else:
        print(f"Message sent to {teams_channel} Teams channel")
