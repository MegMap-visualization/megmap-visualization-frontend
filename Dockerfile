# 用来构建镜像的文本文件
FROM reg.megyueying.com/base/nginx-vts:v1.14.0
ARG VERSION

#设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN mkdir -p /opt/srv/www/map
COPY ./dist/ /opt/srv/www/map/


ARG COMMIT_ID=100001
RUN echo "${COMMIT_ID}" >> /Version
 
EXPOSE 80